import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, User, Users, FileText } from "lucide-react";

interface SearchResult {
  users: Array<{ id: string; full_name: string | null; avatar_url: string | null }>;
  communities: Array<{ id: string; name: string; slug: string; image_url: string | null; member_count: number }>;
  posts: Array<{ id: string; content: string; user_id: string; user_name: string | null }>;
}

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ users: [], communities: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults({ users: [], communities: [], posts: [] });
      return;
    }

    setLoading(true);
    try {
      const searchTerm = `%${searchQuery}%`;

      const [usersRes, communitiesRes, postsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .ilike("full_name", searchTerm)
          .limit(5),
        supabase
          .from("communities")
          .select("id, name, slug, image_url, member_count")
          .ilike("name", searchTerm)
          .limit(5),
        supabase
          .from("posts")
          .select("id, content, user_id, profiles:user_id(full_name)")
          .ilike("content", searchTerm)
          .limit(5),
      ]);

      setResults({
        users: usersRes.data || [],
        communities: communitiesRes.data || [],
        posts: (postsRes.data || []).map((p: any) => ({
          id: p.id,
          content: p.content,
          user_id: p.user_id,
          user_name: p.profiles?.full_name || null,
        })),
      });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const getInitials = (name: string | null) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return "U";
  };

  const truncateContent = (content: string, maxLength: number = 60) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + "...";
  };

  const handleSelect = (type: string, item: any) => {
    setOpen(false);
    setQuery("");
    switch (type) {
      case "user":
        navigate(`/user/${item.id}`);
        break;
      case "community":
        navigate(`/communities/${item.slug}`);
        break;
      case "post":
        navigate("/dashboard");
        break;
    }
  };

  const hasResults = results.users.length > 0 || results.communities.length > 0 || results.posts.length > 0;

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar usuarios, comunidades o posts..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Buscando...
            </div>
          )}

          {!loading && query.length >= 2 && !hasResults && (
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          )}

          {!loading && query.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Escribe al menos 2 caracteres para buscar
            </div>
          )}

          {results.users.length > 0 && (
            <CommandGroup heading="Usuarios">
              {results.users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`user-${user.id}`}
                  onSelect={() => handleSelect("user", user)}
                  className="cursor-pointer"
                >
                  <Avatar className="h-8 w-8 mr-2">
                    {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user.full_name || "Usuario"}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.communities.length > 0 && (
            <CommandGroup heading="Comunidades">
              {results.communities.map((community) => (
                <CommandItem
                  key={community.id}
                  value={`community-${community.id}`}
                  onSelect={() => handleSelect("community", community)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {community.image_url ? (
                      <img
                        src={community.image_url}
                        alt={community.name}
                        className="h-8 w-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{community.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {community.member_count} miembros
                      </p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.posts.length > 0 && (
            <CommandGroup heading="Posts">
              {results.posts.map((post) => (
                <CommandItem
                  key={post.id}
                  value={`post-${post.id}`}
                  onSelect={() => handleSelect("post", post)}
                  className="cursor-pointer"
                >
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{truncateContent(post.content)}</p>
                    <p className="text-xs text-muted-foreground">
                      por {post.user_name || "Usuario"}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};