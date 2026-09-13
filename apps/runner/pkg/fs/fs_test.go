package fs

import (
	"os"
	"path/filepath"
	"sort"
	"testing"

	"github.com/sergi/go-diff/diffmatchpatch"
)

// writeFile creates path (and its parents) with the given content and mode.
func writeFile(t *testing.T, path, content string, mode os.FileMode) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), mode); err != nil {
		t.Fatal(err)
	}
	// WriteFile's mode is filtered by the umask; set it explicitly.
	if err := os.Chmod(path, mode); err != nil {
		t.Fatal(err)
	}
}

func readFile(t *testing.T, path string) string {
	t.Helper()
	b, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}

func exists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func makePatch(from, to string) string {
	dmp := diffmatchpatch.New()
	return dmp.PatchToText(dmp.PatchMake(from, to))
}

func TestFetchDir(t *testing.T) {
	base := t.TempDir()
	writeFile(t, filepath.Join(base, "a.txt"), "a", 0644)
	writeFile(t, filepath.Join(base, "sub", "b.txt"), "b", 0644)
	if err := os.Mkdir(filepath.Join(base, "sub", "nested"), 0755); err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		name     string
		relative string
		want     []DirEntry
		wantErr  bool
	}{
		{"root", "", []DirEntry{{Name: "a.txt"}, {Name: "sub", IsDir: true}}, false},
		{"subdirectory", "sub", []DirEntry{{Name: "b.txt"}, {Name: "nested", IsDir: true}}, false},
		{"empty directory", "sub/nested", nil, false},
		{"missing directory", "nope", nil, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := FetchDir(base, tt.relative)
			if (err != nil) != tt.wantErr {
				t.Fatalf("FetchDir(%q) error = %v, wantErr %v", tt.relative, err, tt.wantErr)
			}
			sort.Slice(got, func(i, j int) bool { return got[i].Name < got[j].Name })
			if len(got) != len(tt.want) {
				t.Fatalf("FetchDir(%q) = %v, want %v", tt.relative, got, tt.want)
			}
			for i := range got {
				if got[i] != tt.want[i] {
					t.Errorf("FetchDir(%q)[%d] = %v, want %v", tt.relative, i, got[i], tt.want[i])
				}
			}
		})
	}
}

func TestFetchFileContent(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "hello.txt")
	writeFile(t, path, "hello\nworld\n", 0644)

	got, err := FetchFileContent(path)
	if err != nil {
		t.Fatalf("FetchFileContent: %v", err)
	}
	if got != "hello\nworld\n" {
		t.Errorf("FetchFileContent = %q, want %q", got, "hello\nworld\n")
	}

	if _, err := FetchFileContent(filepath.Join(dir, "missing.txt")); err == nil {
		t.Error("FetchFileContent on a missing file returned no error")
	}
}

func TestSaveFileDiffs(t *testing.T) {
	const original = "package main\n\nfunc main() {\n\tprintln(\"hi\")\n}\n"
	const updated = "package main\n\nfunc main() {\n\tprintln(\"hello\")\n}\n"

	tests := []struct {
		name    string
		patch   string
		want    string // expected file content afterwards
		wantErr bool
	}{
		{"valid patch applies", makePatch(original, updated), updated, false},
		{"empty patch is a no-op", "", original, false},
		{"malformed patch", "@@ this is not a patch @@\n", original, true},
		{"patch for other content", makePatch("completely different text", "something else entirely"), original, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "main.go")
			writeFile(t, path, original, 0644)

			err := SaveFileDiffs(path, tt.patch)
			if (err != nil) != tt.wantErr {
				t.Fatalf("SaveFileDiffs error = %v, wantErr %v", err, tt.wantErr)
			}
			if got := readFile(t, path); got != tt.want {
				t.Errorf("file content = %q, want %q", got, tt.want)
			}
		})
	}

	t.Run("missing file", func(t *testing.T) {
		path := filepath.Join(t.TempDir(), "missing.go")
		if err := SaveFileDiffs(path, makePatch(original, updated)); err == nil {
			t.Error("SaveFileDiffs on a missing file returned no error")
		}
	})
}

func TestCreateFile(t *testing.T) {
	base := t.TempDir()
	path := filepath.Join(base, "a", "b", "c.txt")

	if err := CreateFile(path); err != nil {
		t.Fatalf("CreateFile: %v", err)
	}
	info, err := os.Stat(path)
	if err != nil {
		t.Fatalf("created file missing: %v", err)
	}
	if info.IsDir() || info.Size() != 0 {
		t.Errorf("created file: isDir=%v size=%d, want an empty regular file", info.IsDir(), info.Size())
	}
}

func TestCreateFolder(t *testing.T) {
	path := filepath.Join(t.TempDir(), "x", "y", "z")

	if err := CreateFolder(path); err != nil {
		t.Fatalf("CreateFolder: %v", err)
	}
	if info, err := os.Stat(path); err != nil || !info.IsDir() {
		t.Fatalf("folder not created: info=%v err=%v", info, err)
	}
	// Creating an existing folder is not an error.
	if err := CreateFolder(path); err != nil {
		t.Errorf("CreateFolder on existing folder: %v", err)
	}
}

func TestDelete(t *testing.T) {
	base := t.TempDir()
	file := filepath.Join(base, "file.txt")
	dir := filepath.Join(base, "dir")
	writeFile(t, file, "x", 0644)
	writeFile(t, filepath.Join(dir, "nested", "inner.txt"), "y", 0644)

	for _, path := range []string{file, dir} {
		if err := Delete(path); err != nil {
			t.Fatalf("Delete(%s): %v", path, err)
		}
		if exists(path) {
			t.Errorf("Delete(%s): path still exists", path)
		}
	}
	// Deleting something that does not exist is not an error (os.RemoveAll).
	if err := Delete(filepath.Join(base, "missing")); err != nil {
		t.Errorf("Delete on missing path: %v", err)
	}
}

func TestRename(t *testing.T) {
	base := t.TempDir()
	oldPath := filepath.Join(base, "old.txt")
	newPath := filepath.Join(base, "new.txt")
	writeFile(t, oldPath, "content", 0644)

	if err := Rename(oldPath, newPath); err != nil {
		t.Fatalf("Rename: %v", err)
	}
	if exists(oldPath) {
		t.Error("old path still exists after Rename")
	}
	if got := readFile(t, newPath); got != "content" {
		t.Errorf("renamed file content = %q, want %q", got, "content")
	}

	if err := Rename(filepath.Join(base, "missing"), filepath.Join(base, "other")); err == nil {
		t.Error("Rename of a missing path returned no error")
	}
}

func TestCopyFile(t *testing.T) {
	base := t.TempDir()
	src := filepath.Join(base, "script.sh")
	dst := filepath.Join(base, "out", "deeper", "script.sh")
	writeFile(t, src, "#!/bin/sh\necho hi\n", 0750)

	if err := Copy(src, dst); err != nil {
		t.Fatalf("Copy: %v", err)
	}
	if got := readFile(t, dst); got != "#!/bin/sh\necho hi\n" {
		t.Errorf("copied content = %q", got)
	}
	info, err := os.Stat(dst)
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode().Perm() != 0750 {
		t.Errorf("copied mode = %v, want %v", info.Mode().Perm(), os.FileMode(0750))
	}
	if !exists(src) {
		t.Error("Copy removed the source")
	}
}

func TestCopyDir(t *testing.T) {
	base := t.TempDir()
	src := filepath.Join(base, "src")
	dst := filepath.Join(base, "dst")
	writeFile(t, filepath.Join(src, "top.txt"), "top", 0644)
	writeFile(t, filepath.Join(src, "a", "b", "deep.sh"), "deep", 0700)

	if err := Copy(src, dst); err != nil {
		t.Fatalf("Copy: %v", err)
	}

	files := []struct {
		rel     string
		content string
		mode    os.FileMode
	}{
		{"top.txt", "top", 0644},
		{filepath.Join("a", "b", "deep.sh"), "deep", 0700},
	}
	for _, f := range files {
		path := filepath.Join(dst, f.rel)
		if got := readFile(t, path); got != f.content {
			t.Errorf("%s content = %q, want %q", f.rel, got, f.content)
		}
		info, err := os.Stat(path)
		if err != nil {
			t.Fatal(err)
		}
		if info.Mode().Perm() != f.mode {
			t.Errorf("%s mode = %v, want %v", f.rel, info.Mode().Perm(), f.mode)
		}
	}
	if !exists(filepath.Join(src, "a", "b", "deep.sh")) {
		t.Error("Copy removed the source tree")
	}

	if err := Copy(filepath.Join(base, "missing"), filepath.Join(base, "x")); err == nil {
		t.Error("Copy of a missing path returned no error")
	}
}

// The clipboard is package-global, so these tests must not run in parallel.

func TestCutPaste(t *testing.T) {
	t.Cleanup(func() { clipboard = nil })

	base := t.TempDir()
	src := filepath.Join(base, "project")
	writeFile(t, filepath.Join(src, "main.go"), "package main", 0644)
	target := filepath.Join(base, "moved", "project")

	if err := Cut(src); err != nil {
		t.Fatalf("Cut: %v", err)
	}
	if !exists(src) {
		t.Fatal("Cut alone must not move anything")
	}
	if err := Paste(target); err != nil {
		t.Fatalf("Paste: %v", err)
	}
	if exists(src) {
		t.Error("source still exists after cut+paste")
	}
	if got := readFile(t, filepath.Join(target, "main.go")); got != "package main" {
		t.Errorf("pasted content = %q", got)
	}

	// The clipboard is cleared by Paste, so a second paste has nothing to do.
	if err := Paste(filepath.Join(base, "again")); err == nil {
		t.Error("second Paste returned no error, want nothing to paste")
	}
}

func TestCutMissingSource(t *testing.T) {
	t.Cleanup(func() { clipboard = nil })

	if err := Cut(filepath.Join(t.TempDir(), "missing")); err == nil {
		t.Error("Cut of a missing path returned no error")
	}
	if clipboard != nil {
		t.Errorf("clipboard = %+v after failed Cut, want nil", clipboard)
	}
}

func TestPasteEmptyClipboard(t *testing.T) {
	clipboard = nil
	target := filepath.Join(t.TempDir(), "target")

	if err := Paste(target); err == nil {
		t.Error("Paste with empty clipboard returned no error")
	}
	if exists(target) {
		t.Error("Paste with empty clipboard created the target")
	}
}
