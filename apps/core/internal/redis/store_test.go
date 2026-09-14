package redis

import (
	"context"
	"slices"
	"testing"

	"core/models"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

// Ids in the shapes core issues: GitHub accounts by their numeric id, email
// accounts by a hash of the address.
const (
	aliceId = "gh:1001"
	bobId   = "email:5d41402abc4b2a76b9719d911017c592"
)

func newTestStore(t *testing.T) (*Redis, *miniredis.Miniredis) {
	t.Helper()
	mr := miniredis.RunT(t)
	client := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	t.Cleanup(func() { client.Close() })
	return &Redis{client: client, ctx: context.Background()}, mr
}

func TestPing(t *testing.T) {
	store, _ := newTestStore(t)
	if err := store.Ping(); err != nil {
		t.Fatalf("Ping: %v", err)
	}
}

func TestCreateAndGetRepl(t *testing.T) {
	store, mr := newTestStore(t)

	repl := models.Repl{User: "alice", UserId: aliceId, Id: "repl-1", Name: "My Repl", Template: "node", IsActive: false}

	if err := store.CreateRepl(&repl); err != nil {
		t.Fatalf("CreateRepl: %v", err)
	}

	got, err := store.GetRepl(repl.Id)
	if err != nil {
		t.Fatalf("GetRepl: %v", err)
	}
	if got != repl {
		t.Errorf("GetRepl = %+v, want %+v", got, repl)
	}

	// Records already in production, and the migration that rewrites them,
	// depend on this key layout; pin it.
	for field, want := range map[string]string{"id": "repl-1", "user": "alice", "userId": aliceId, "template": "node"} {
		if v := mr.HGet("repl:repl-1", field); v != want {
			t.Errorf("repl:repl-1 %s = %q, want %q", field, v, want)
		}
	}
	if ok, _ := mr.SIsMember("user:"+aliceId, "repl-1"); !ok {
		t.Errorf("repl-1 not added to user:%s", aliceId)
	}
}

func TestGetReplMissing(t *testing.T) {
	store, _ := newTestStore(t)

	if _, err := store.GetRepl("repl-missing"); err == nil {
		t.Fatal("GetRepl on a missing repl returned no error")
	}
}

func TestGetUserRepls(t *testing.T) {
	store, _ := newTestStore(t)

	for _, id := range []string{"repl-1", "repl-2"} {
		repl := models.Repl{Template: "go", User: "alice", UserId: aliceId, Id: id, IsActive: false, Name: id}
		if err := store.CreateRepl(&repl); err != nil {
			t.Fatalf("CreateRepl %s: %v", id, err)
		}
	}

	repl := models.Repl{Template: "go", User: "bob", UserId: bobId, Id: "repl-3", IsActive: false, Name: "bobs"}
	if err := store.CreateRepl(&repl); err != nil {
		t.Fatalf("CreateRepl: %v", err)
	}

	got, err := store.GetUserRepls(aliceId)
	if err != nil {
		t.Fatalf("GetUserRepls: %v", err)
	}
	slices.Sort(got)
	if want := []string{"repl-1", "repl-2"}; !slices.Equal(got, want) {
		t.Errorf("GetUserRepls(alice) = %v, want %v", got, want)
	}

	none, err := store.GetUserRepls("nobody")
	if err != nil {
		t.Fatalf("GetUserRepls(nobody): %v", err)
	}
	if len(none) != 0 {
		t.Errorf("GetUserRepls(nobody) = %v, want empty", none)
	}
}

func TestCreateUserRepl(t *testing.T) {
	store, _ := newTestStore(t)

	if err := store.CreateUserRepl(aliceId, "repl-1"); err != nil {
		t.Fatalf("CreateUserRepl: %v", err)
	}
	got, err := store.GetUserRepls(aliceId)
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Equal(got, []string{"repl-1"}) {
		t.Errorf("GetUserRepls = %v, want [repl-1]", got)
	}
}

func TestDeleteRepl(t *testing.T) {
	store, mr := newTestStore(t)

	replOne := models.Repl{Template: "python", User: "bob", UserId: bobId, Id: "repl-1", IsActive: false, Name: "a"}

	replTwo := models.Repl{Template: "python", User: "bob", UserId: bobId, Id: "repl-2", IsActive: false, Name: "b"}

	if err := store.CreateRepl(&replOne); err != nil {
		t.Fatal(err)
	}
	if err := store.CreateRepl(&replTwo); err != nil {
		t.Fatal(err)
	}

	if err := store.DeleteRepl("repl-1"); err != nil {
		t.Fatalf("DeleteRepl: %v", err)
	}

	if _, err := store.GetRepl("repl-1"); err == nil {
		t.Error("repl-1 still readable after DeleteRepl")
	}
	if mr.Exists("repl:repl-1") {
		t.Error("repl:repl-1 hash still exists")
	}
	got, err := store.GetUserRepls(replOne.UserId)
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Equal(got, []string{"repl-2"}) {
		t.Errorf("GetUserRepls after delete = %v, want [repl-2]", got)
	}
}

func TestDeleteReplErrors(t *testing.T) {
	store, mr := newTestStore(t)

	if err := store.DeleteRepl("repl-missing"); err == nil {
		t.Error("DeleteRepl on a missing repl returned no error")
	}

	// A hash without an id field is treated as missing.
	mr.HSet("repl:orphan", "name", "orphan")
	if err := store.DeleteRepl("orphan"); err == nil {
		t.Error("DeleteRepl on a repl without an id returned no error")
	}
}

func TestReplSession(t *testing.T) {
	store, _ := newTestStore(t)

	repl := models.Repl{User: "alice", UserId: aliceId, Id: "repl-1", Name: "a", Template: "node", IsActive: false}

	if err := store.CreateRepl(&repl); err != nil {
		t.Fatal(err)
	}

	if err := store.CreateReplSession("repl-1"); err != nil {
		t.Fatalf("CreateReplSession: %v", err)
	}
	if repl, err := store.GetRepl("repl-1"); err != nil || !repl.IsActive {
		t.Errorf("after CreateReplSession: repl = %+v, err = %v; want active", repl, err)
	}

	if err := store.DeleteReplSession("repl-1"); err != nil {
		t.Fatalf("DeleteReplSession: %v", err)
	}
	if repl, err := store.GetRepl("repl-1"); err != nil || repl.IsActive {
		t.Errorf("after DeleteReplSession: repl = %+v, err = %v; want inactive", repl, err)
	}
}

// Two accounts can share a display name; their workspaces must stay apart.
func TestGetUserReplsSameDisplayName(t *testing.T) {
	store, _ := newTestStore(t)

	mine := models.Repl{Id: "repl-1", Name: "mine", User: "alice", UserId: aliceId, Template: "node"}
	theirs := models.Repl{Id: "repl-2", Name: "theirs", User: "alice", UserId: bobId, Template: "node"}
	for _, r := range []models.Repl{mine, theirs} {
		if err := store.CreateRepl(&r); err != nil {
			t.Fatalf("CreateRepl %s: %v", r.Id, err)
		}
	}

	for id, want := range map[string][]string{aliceId: {"repl-1"}, bobId: {"repl-2"}} {
		got, err := store.GetUserRepls(id)
		if err != nil {
			t.Fatalf("GetUserRepls(%s): %v", id, err)
		}
		if !slices.Equal(got, want) {
			t.Errorf("GetUserRepls(%s) = %v, want %v", id, got, want)
		}
	}
	// The old key, keyed by display name, must not be written any more.
	if members, _ := store.GetUserRepls("alice"); len(members) != 0 {
		t.Errorf("user:alice = %v, want empty", members)
	}
}

// A record written before owner ids existed: string booleans and no userId.
// It must still decode, and it has no owner until it is migrated.
func TestGetReplLegacyRecord(t *testing.T) {
	store, mr := newTestStore(t)

	mr.HSet("repl:repl-old", "id", "repl-old", "name", "old", "user", "alice", "template", "python", "isActive", "true")

	got, err := store.GetRepl("repl-old")
	if err != nil {
		t.Fatalf("GetRepl: %v", err)
	}
	want := models.Repl{Id: "repl-old", Name: "old", User: "alice", Template: "python", IsActive: true}
	if got != want {
		t.Errorf("GetRepl = %+v, want %+v", got, want)
	}
	if got.UserId != "" {
		t.Errorf("legacy record UserId = %q, want empty (no owner until migrated)", got.UserId)
	}
}

// isActive is written as a boolean now; both the old "true"/"false" and the
// new encoding must read back the same way.
func TestReplSessionEncoding(t *testing.T) {
	store, mr := newTestStore(t)

	repl := models.Repl{Id: "repl-1", Name: "a", User: "alice", UserId: aliceId, Template: "node"}
	if err := store.CreateRepl(&repl); err != nil {
		t.Fatal(err)
	}
	if err := store.CreateReplSession("repl-1"); err != nil {
		t.Fatal(err)
	}
	// go-redis writes a Go bool as "1" or "0".
	if v := mr.HGet("repl:repl-1", "isActive"); v != "1" {
		t.Errorf("isActive stored as %q, want 1", v)
	}

	for raw, want := range map[string]bool{"true": true, "false": false, "1": true, "0": false} {
		mr.HSet("repl:repl-1", "isActive", raw)
		if got, err := store.GetRepl("repl-1"); err != nil || got.IsActive != want {
			t.Errorf("isActive %q: repl = %+v, err = %v; want IsActive %v", raw, got, err, want)
		}
	}
}
