package redis

import (
	"context"
	"slices"
	"testing"

	"core/models"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
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

	repl := models.Repl{User: "alice", UserId: "gh:alice@gmail.com", Id: "repl-1", Name: "My Repl", Template: "node", IsActive: false}

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

	// The key layout is shared with the runner; pin it.
	if v := mr.HGet("repl:repl-1", "user"); v != "alice" {
		t.Errorf("repl:repl-1 user = %q, want alice", v)
	}
	if ok, _ := mr.SIsMember("user:gh:alice@gmail.com", "repl-1"); !ok {
		t.Error("repl-1 not added to user:alice")
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
		repl := models.Repl{Template: "go", User: "alice", UserId: "email:alice@something.com", Id: id, IsActive: false, Name: id}
		if err := store.CreateRepl(&repl); err != nil {
			t.Fatalf("CreateRepl %s: %v", id, err)
		}
	}

	repl := models.Repl{Template: "go", User: "bob", UserId: "email:bob@something.com", Id: "repl-3", IsActive: false, Name: "bobs"}
	if err := store.CreateRepl(&repl); err != nil {
		t.Fatalf("CreateRepl: %v", err)
	}

	got, err := store.GetUserRepls("email:alice@something.com")
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

	if err := store.CreateUserRepl("alice", "repl-1"); err != nil {
		t.Fatalf("CreateUserRepl: %v", err)
	}
	got, err := store.GetUserRepls("alice")
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Equal(got, []string{"repl-1"}) {
		t.Errorf("GetUserRepls = %v, want [repl-1]", got)
	}
}

func TestDeleteRepl(t *testing.T) {
	store, mr := newTestStore(t)

	replOne := models.Repl{Template: "python", User: "bob", UserId: "email:bob@something.com", Id: "repl-1", IsActive: false, Name: "a"}

	replTwo := models.Repl{Template: "python", User: "bob", UserId: "email:bob@something.com", Id: "repl-2", IsActive: false, Name: "b"}

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

	// A hash without a user field cannot be unlinked from a user set.
	mr.HSet("repl:orphan", "name", "orphan")
	if err := store.DeleteRepl("orphan"); err == nil {
		t.Error("DeleteRepl on a repl without a user returned no error")
	}
}

func TestReplSession(t *testing.T) {
	store, _ := newTestStore(t)

	repl := models.Repl{User: "alice", UserId: "gh:alice@gmail.com", Id: "repl-1", Name: "a", Template: "node", IsActive: false}

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
