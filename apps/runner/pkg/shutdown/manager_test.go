package shutdown

import (
	"sync/atomic"
	"testing"
	"time"
)

// waitTimeout bounds every wait so a broken timer fails the test instead of
// hanging it.
const waitTimeout = 5 * time.Second

// recorder is a ShutdownCallback that counts calls and reports each one.
type recorder struct {
	calls  atomic.Int32
	replId chan string
}

func newRecorder() *recorder {
	return &recorder{replId: make(chan string, 8)}
}

func (r *recorder) callback(replId string) error {
	r.calls.Add(1)
	r.replId <- replId
	return nil
}

func (r *recorder) waitCall(t *testing.T) string {
	t.Helper()
	select {
	case id := <-r.replId:
		return id
	case <-time.After(waitTimeout):
		t.Fatal("shutdown callback was not called")
		return ""
	}
}

func (r *recorder) assertNoCall(t *testing.T, wait time.Duration) {
	t.Helper()
	select {
	case <-r.replId:
		t.Fatal("shutdown callback was called, want no call")
	case <-time.After(wait):
	}
}

// newManager returns a manager whose inactivity period is d and whose timer
// is not running yet: it is left in the "connection active" state.
//
// SetInactivityPeriod is only called while a connection is active, because
// with no connection it re-locks the manager's mutex and never returns.
func newManager(t *testing.T, d time.Duration, cb ShutdownCallback) *ShutdownManager {
	t.Helper()
	sm := NewShutdownManager("repl-test", cb)
	t.Cleanup(sm.Close)
	sm.OnConnectionEstablished()
	sm.SetInactivityPeriod(d)
	return sm
}

// closeConnection calls OnConnectionClosed and waits until the timer it
// restarts in a goroutine has actually been armed.
func closeConnection(t *testing.T, sm *ShutdownManager) {
	t.Helper()
	sm.OnConnectionClosed()
	deadline := time.Now().Add(waitTimeout)
	for {
		sm.mu.RLock()
		armed := sm.timer != nil || sm.isShutdown
		sm.mu.RUnlock()
		if armed {
			return
		}
		if time.Now().After(deadline) {
			t.Fatal("shutdown timer was not restarted")
		}
		time.Sleep(time.Millisecond)
	}
}

func TestNewShutdownManagerDefaults(t *testing.T) {
	sm := NewShutdownManager("repl-test", nil)
	t.Cleanup(sm.Close)

	sm.mu.RLock()
	period, timer := sm.inactivityPeriod, sm.timer
	sm.mu.RUnlock()

	if period != 4*time.Minute {
		t.Errorf("inactivity period = %v, want 4m", period)
	}
	if timer == nil {
		t.Error("timer not started on creation")
	}
	if sm.IsShutdown() || sm.HasActiveConnection() {
		t.Errorf("IsShutdown=%v HasActiveConnection=%v, want both false", sm.IsShutdown(), sm.HasActiveConnection())
	}
}

func TestShutdownAfterInactivity(t *testing.T) {
	const period = 30 * time.Millisecond
	rec := newRecorder()
	sm := newManager(t, period, rec.callback)

	start := time.Now()
	closeConnection(t, sm)

	if id := rec.waitCall(t); id != "repl-test" {
		t.Errorf("callback replId = %q, want %q", id, "repl-test")
	}
	if elapsed := time.Since(start); elapsed < period {
		t.Errorf("callback after %v, want at least %v", elapsed, period)
	}
	if !sm.IsShutdown() {
		t.Error("IsShutdown = false after shutdown")
	}
	select {
	case <-sm.Context().Done():
	case <-time.After(waitTimeout):
		t.Error("context not cancelled after shutdown")
	}
}

func TestConnectionEstablishedStopsTimer(t *testing.T) {
	const period = 50 * time.Millisecond
	rec := newRecorder()
	sm := newManager(t, period, rec.callback)

	closeConnection(t, sm)
	sm.OnConnectionEstablished()

	rec.assertNoCall(t, 4*period)
	if sm.IsShutdown() {
		t.Error("IsShutdown = true with an active connection")
	}
	if !sm.HasActiveConnection() {
		t.Error("HasActiveConnection = false after OnConnectionEstablished")
	}
	if err := sm.Context().Err(); err != nil {
		t.Errorf("context error = %v, want nil", err)
	}
}

func TestConnectionClosedRestartsTimer(t *testing.T) {
	const period = 30 * time.Millisecond
	rec := newRecorder()
	sm := newManager(t, period, rec.callback)

	// While connected, nothing fires.
	rec.assertNoCall(t, 3*period)

	closeConnection(t, sm)
	if sm.HasActiveConnection() {
		t.Error("HasActiveConnection = true after OnConnectionClosed")
	}
	rec.waitCall(t)
}

func TestCallbackRunsOnce(t *testing.T) {
	const period = 20 * time.Millisecond
	rec := newRecorder()
	sm := newManager(t, period, rec.callback)

	closeConnection(t, sm)
	rec.waitCall(t)

	// Everything after shutdown is a no-op.
	sm.OnConnectionEstablished()
	sm.OnConnectionClosed()
	sm.SetInactivityPeriod(period)
	sm.Close()

	rec.assertNoCall(t, 5*period)
	if n := rec.calls.Load(); n != 1 {
		t.Errorf("callback called %d times, want 1", n)
	}
}

func TestCloseCancelsWithoutCallback(t *testing.T) {
	const period = 50 * time.Millisecond
	rec := newRecorder()
	sm := newManager(t, period, rec.callback)

	closeConnection(t, sm)
	sm.Close()
	sm.Close() // idempotent

	if !sm.IsShutdown() {
		t.Error("IsShutdown = false after Close")
	}
	select {
	case <-sm.Context().Done():
	default:
		t.Error("context not cancelled by Close")
	}
	rec.assertNoCall(t, 3*period)
}
