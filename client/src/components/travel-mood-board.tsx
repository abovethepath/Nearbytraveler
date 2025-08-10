import React, { useState, useContext } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Heart, MapPin, Camera, Palette, Save, Trash2, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MoodBoardItem {
  id: number;
  userId: number;
  title: string;
  description?: string;
  imageUrl?: string;
  type: 'image' | 'text' | 'location' | 'activity';
  color?: string;
  tags: string[];
  position: { x: number; y: number };
  createdAt: Date;
}

interface MoodBoard {
  id: number;
  userId: number;
  title: string;
  description?: string;
  destination?: string;
  isPublic: boolean;
  items: MoodBoardItem[];
  createdAt: Date;
}

export default function TravelMoodBoard() {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const [selectedBoard, setSelectedBoard] = useState<MoodBoard | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    imageUrl: "",
    type: "text" as const,
    color: "#3B82F6",
    tags: [] as string[],
    position: { x: 100, y: 100 }
  });
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // Fetch user's mood boards
  const { data: moodBoards = [], isLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/mood-boards`],
    enabled: !!user?.id
  });

  // Create mood board mutation
  const createMoodBoard = useMutation({
    mutationFn: async (data: { title: string; description?: string; destination?: string; isPublic: boolean }) => {
      return await apiRequest("POST", "/api/mood-boards", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/mood-boards`] });
      toast({ title: "Mood board created successfully!" });
      setIsCreating(false);
    },
    onError: () => {
      toast({ title: "Failed to create mood board", variant: "destructive" });
    }
  });

  // Add item to mood board mutation
  const addMoodBoardItem = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/mood-boards/${selectedBoard?.id}/items`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/mood-boards`] });
      toast({ title: "Item added to mood board!" });
      setNewItem({
        title: "",
        description: "",
        imageUrl: "",
        type: "text",
        color: "#3B82F6",
        tags: [],
        position: { x: 100, y: 100 }
      });
    },
    onError: () => {
      toast({ title: "Failed to add item", variant: "destructive" });
    }
  });

  // Update item position mutation
  const updateItemPosition = useMutation({
    mutationFn: async ({ itemId, position }: { itemId: number; position: { x: number; y: number } }) => {
      return await apiRequest("PATCH", `/api/mood-board-items/${itemId}`, { position });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/mood-boards`] });
    }
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem && selectedBoard) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      updateItemPosition.mutate({
        itemId: draggedItem,
        position: { x, y }
      });
      setDraggedItem(null);
    }
  };

  const handleItemDragStart = (e: React.DragEvent, itemId: number) => {
    setDraggedItem(itemId);
  };

  const predefinedColors = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", 
    "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
  ];

  const itemTypes = [
    { value: "text", label: "Text Note", icon: "📝" },
    { value: "image", label: "Image", icon: "🖼️" },
    { value: "location", label: "Location", icon: "📍" },
    { value: "activity", label: "Activity", icon: "🎯" }
  ];

  if (isLoading) return <div>Loading mood boards...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Travel Mood Boards</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Mood Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Mood Board</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createMoodBoard.mutate({
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                destination: formData.get('destination') as string,
                isPublic: (formData.get('isPublic') as string) === 'on'
              });
            }}>
              <div className="space-y-4">
                <Input name="title" placeholder="Mood board title" required />
                <Textarea name="description" placeholder="Description (optional)" />
                <Input name="destination" placeholder="Destination (optional)" />
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="isPublic" />
                  <span>Make public</span>
                </label>
                <Button type="submit" disabled={createMoodBoard.isPending}>
                  {createMoodBoard.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mood Board List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {moodBoards.map((board: MoodBoard) => (
          <Card key={board.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {board.title}
                <div className="flex space-x-2">
                  {board.isPublic && <Eye className="w-4 h-4 text-gray-500" />}
                  <Badge variant="secondary">{board.items?.length || 0} items</Badge>
                </div>
              </CardTitle>
              {board.destination && (
                <p className="text-sm text-gray-600 flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {board.destination}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{board.description}</p>
              <Button onClick={() => setSelectedBoard(board)} className="w-full">
                Open Board
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mood Board Canvas */}
      {selectedBoard && (
        <Dialog open={!!selectedBoard} onOpenChange={() => setSelectedBoard(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedBoard.title}</span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Item</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Title"
                        value={newItem.title}
                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                      />
                      <Textarea
                        placeholder="Description"
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      />
                      
                      {/* Item Type Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {itemTypes.map((type) => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => setNewItem({ ...newItem, type: type.value as any })}
                              className={`p-3 border rounded-lg text-center transition-colors ${
                                newItem.type === type.value 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-2xl mb-1">{type.icon}</div>
                              <div className="text-xs">{type.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {newItem.type === 'image' && (
                        <Input
                          placeholder="Image URL"
                          value={newItem.imageUrl}
                          onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                        />
                      )}

                      {/* Color Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Color</label>
                        <div className="flex space-x-2">
                          {predefinedColors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewItem({ ...newItem, color })}
                              className={`w-8 h-8 rounded-full border-2 ${
                                newItem.color === color ? 'border-gray-800' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <Button 
                        onClick={() => addMoodBoardItem.mutate(newItem)}
                        disabled={addMoodBoardItem.isPending || !newItem.title}
                        className="w-full"
                      >
                        {addMoodBoardItem.isPending ? "Adding..." : "Add Item"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </DialogTitle>
            </DialogHeader>

            {/* Canvas Area */}
            <div 
              className="relative w-full h-96 bg-gray-50 border rounded-lg overflow-auto"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {selectedBoard.items?.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleItemDragStart(e, item.id)}
                  className="absolute cursor-move"
                  style={{
                    left: item.position.x,
                    top: item.position.y,
                    backgroundColor: item.color || '#3B82F6'
                  }}
                >
                  <Card className="w-48 shadow-lg">
                    <CardContent className="p-3">
                      {item.type === 'image' && item.imageUrl && (
                        <img src={item.imageUrl} alt={item.title} className="w-full h-24 object-cover rounded mb-2" />
                      )}
                      <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-gray-600 mb-2">{item.description}</p>
                      )}
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}