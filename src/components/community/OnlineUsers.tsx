import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";

interface OnlineUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  online_at: string;
}

interface OnlineUsersProps {
  users: OnlineUser[];
  count: number;
}

export const OnlineUsers = ({ users, count }: OnlineUsersProps) => {
  const navigate = useNavigate();

  const getInitials = (name: string | null) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return "U";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Circle className="h-3 w-3 fill-green-500 text-green-500" />
          Usuarios en línea
          <Badge variant="secondary" className="ml-auto">
            {count}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No hay usuarios en línea
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {users.slice(0, 10).map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                onClick={() => navigate(`/user/${user.id}`)}
                title={user.full_name || "Usuario"}
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />
                </div>
                <span className="text-sm truncate max-w-[100px]">
                  {user.full_name || "Usuario"}
                </span>
              </div>
            ))}
            {users.length > 10 && (
              <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                +{users.length - 10} más
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};