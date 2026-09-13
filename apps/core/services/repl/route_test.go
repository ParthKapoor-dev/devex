package repl

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"testing"

	"core/cmd/middleware"
	"core/internal/k8s"
	"core/models"
)

// None of these tests should reach Kubernetes. If a regression lets a request
// through to internal/k8s, it must fail here rather than use the local
// kubeconfig.
func TestMain(m *testing.M) {
	k8s.KUBE_CONFIG_PATH = filepath.Join(os.TempDir(), "devex-core-tests-no-kubeconfig")
	os.Exit(m.Run())
}

type fakeStore struct {
	repls     map[string]models.Repl
	userRepls map[string][]string
	// created holds the args of each CreateRepl call.
	created [][4]string
	deleted []string
}

func newFakeStore(repls ...models.Repl) *fakeStore {
	s := &fakeStore{repls: map[string]models.Repl{}, userRepls: map[string][]string{}}
	for _, r := range repls {
		s.repls[r.Id] = r
		s.userRepls[r.User] = append(s.userRepls[r.User], r.Id)
	}
	return s
}

func (s *fakeStore) CreateRepl(template, username, replName, replId string) error {
	s.created = append(s.created, [4]string{template, username, replName, replId})
	s.repls[replId] = models.Repl{Id: replId, Name: replName, User: username, Template: template}
	s.userRepls[username] = append(s.userRepls[username], replId)
	return nil
}

func (s *fakeStore) DeleteRepl(replId string) error {
	s.deleted = append(s.deleted, replId)
	delete(s.repls, replId)
	return nil
}

func (s *fakeStore) GetRepl(replId string) (models.Repl, error) {
	r, ok := s.repls[replId]
	if !ok {
		return models.Repl{}, errors.New("No such Repl Found")
	}
	return r, nil
}

func (s *fakeStore) GetUserRepls(username string) ([]string, error) {
	return s.userRepls[username], nil
}

func (s *fakeStore) CreateReplSession(replId string) error {
	return s.setActive(replId, true)
}

func (s *fakeStore) DeleteReplSession(replId string) error {
	return s.setActive(replId, false)
}

func (s *fakeStore) setActive(replId string, active bool) error {
	r := s.repls[replId]
	r.IsActive = active
	s.repls[replId] = r
	return nil
}

type fakeStorage struct {
	copies  [][2]string
	deletes []string
	copyErr error
}

func (f *fakeStorage) CopyFolder(sourcePrefix, destinationPrefix string) error {
	f.copies = append(f.copies, [2]string{sourcePrefix, destinationPrefix})
	return f.copyErr
}

func (f *fakeStorage) DeleteFolder(folderPrefix string) error {
	f.deletes = append(f.deletes, folderPrefix)
	return nil
}

// do sends a request as the given GitHub/magic-link login, the way
// AuthMiddleware would after a successful check.
func do(t *testing.T, h http.Handler, login, method, path, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	ctx := context.WithValue(req.Context(), middleware.UserContextKey, &models.User{Login: login})
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req.WithContext(ctx))
	return rec
}

func TestGetUserRepls(t *testing.T) {
	store := newFakeStore(
		models.Repl{Id: "repl-1", Name: "one", User: "alice", Template: "node"},
		models.Repl{Id: "repl-2", Name: "two", User: "alice", Template: "go", IsActive: true},
		models.Repl{Id: "repl-3", Name: "bobs", User: "bob", Template: "python"},
	)
	// An id in the user's set with no hash behind it is skipped.
	store.userRepls["alice"] = append(store.userRepls["alice"], "repl-gone")
	h := NewHandler(&fakeStorage{}, store)

	// Logins are lower-cased before lookup.
	rec := do(t, h, "Alice", http.MethodGet, "/", "")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
	}
	var got []models.Repl
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode %s: %v", rec.Body, err)
	}
	want := []models.Repl{store.repls["repl-1"], store.repls["repl-2"]}
	if !slices.Equal(got, want) {
		t.Errorf("repls = %+v, want %+v", got, want)
	}
}

func TestReplRoutesRequireOwnership(t *testing.T) {
	routes := []struct {
		method string
		path   string
	}{
		{http.MethodDelete, "/repl-1"},
		{http.MethodGet, "/session/repl-1"},
		{http.MethodDelete, "/session/repl-1"},
	}

	for _, route := range routes {
		t.Run(route.method+" "+route.path, func(t *testing.T) {
			store := newFakeStore(models.Repl{Id: "repl-1", User: "alice", Template: "node", IsActive: true})
			storage := &fakeStorage{}
			h := NewHandler(storage, store)

			rec := do(t, h, "mallory", route.method, route.path, "")

			if rec.Code != http.StatusUnauthorized {
				t.Errorf("status = %d, want 401; body = %s", rec.Code, rec.Body)
			}
			if r := store.repls["repl-1"]; !r.IsActive || len(store.deleted) != 0 || len(storage.deletes) != 0 {
				t.Errorf("non-owner changed state: repl = %+v, deleted = %v, s3 deletes = %v", r, store.deleted, storage.deletes)
			}
		})
	}
}

func TestReplRoutesUnknownRepl(t *testing.T) {
	routes := []struct {
		method string
		path   string
	}{
		{http.MethodDelete, "/repl-missing"},
		{http.MethodGet, "/session/repl-missing"},
		{http.MethodDelete, "/session/repl-missing"},
	}

	for _, route := range routes {
		t.Run(route.method+" "+route.path, func(t *testing.T) {
			h := NewHandler(&fakeStorage{}, newFakeStore())

			rec := do(t, h, "alice", route.method, route.path, "")

			if rec.Code != http.StatusBadRequest {
				t.Errorf("status = %d, want 400; body = %s", rec.Code, rec.Body)
			}
		})
	}
}

func TestNewRepl(t *testing.T) {
	store := newFakeStore()
	storage := &fakeStorage{}
	h := NewHandler(storage, store)

	rec := do(t, h, "Alice", http.MethodPost, "/new", `{"template":"node","replName":"my app"}`)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
	}
	if len(store.created) != 1 {
		t.Fatalf("CreateRepl calls = %v, want 1", store.created)
	}
	template, user, name, replId := store.created[0][0], store.created[0][1], store.created[0][2], store.created[0][3]
	if template != "node" || user != "alice" || name != "my app" {
		t.Errorf("CreateRepl(%q, %q, %q, _), want (node, alice, my app)", template, user, name)
	}
	if !regexp.MustCompile(`^repl-[0-9a-f-]{36}$`).MatchString(replId) {
		t.Errorf("repl id = %q, want repl-<uuid>", replId)
	}

	wantCopy := [2]string{"templates/node", "repl/alice/" + replId + "/"}
	if len(storage.copies) != 1 || storage.copies[0] != wantCopy {
		t.Errorf("CopyFolder calls = %v, want [%v]", storage.copies, wantCopy)
	}
}

func TestNewReplLimitReached(t *testing.T) {
	store := newFakeStore(
		models.Repl{Id: "repl-1", User: "alice"},
		models.Repl{Id: "repl-2", User: "alice"},
	)
	storage := &fakeStorage{}
	h := NewHandler(storage, store)

	rec := do(t, h, "alice", http.MethodPost, "/new", `{"template":"node","replName":"third"}`)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want 500", rec.Code)
	}
	if len(storage.copies) != 0 || len(store.created) != 0 {
		t.Errorf("repl created past the limit: copies = %v, created = %v", storage.copies, store.created)
	}
}

func TestNewReplBadBody(t *testing.T) {
	store := newFakeStore()
	storage := &fakeStorage{}
	h := NewHandler(storage, store)

	rec := do(t, h, "alice", http.MethodPost, "/new", `{not json`)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rec.Code)
	}
	if len(storage.copies) != 0 || len(store.created) != 0 {
		t.Errorf("bad body still created a repl: copies = %v, created = %v", storage.copies, store.created)
	}
}

func TestNewReplCopyFails(t *testing.T) {
	store := newFakeStore()
	storage := &fakeStorage{copyErr: errors.New("r2 unavailable")}
	h := NewHandler(storage, store)

	rec := do(t, h, "alice", http.MethodPost, "/new", `{"template":"node","replName":"x"}`)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want 500", rec.Code)
	}
	if len(store.created) != 0 {
		t.Errorf("repl record stored although the template copy failed: %v", store.created)
	}
}

func TestDeleteReplByOwner(t *testing.T) {
	store := newFakeStore(models.Repl{Id: "repl-1", User: "alice", Template: "node", IsActive: true})
	storage := &fakeStorage{}
	h := NewHandler(storage, store)

	rec := do(t, h, "alice", http.MethodDelete, "/repl-1", "")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
	}
	if want := []string{"repl/alice/repl-1/"}; !slices.Equal(storage.deletes, want) {
		t.Errorf("DeleteFolder calls = %v, want %v", storage.deletes, want)
	}
	if want := []string{"repl-1"}; !slices.Equal(store.deleted, want) {
		t.Errorf("DeleteRepl calls = %v, want %v", store.deleted, want)
	}
}
