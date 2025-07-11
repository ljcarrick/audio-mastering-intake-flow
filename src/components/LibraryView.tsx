import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Music, 
  User, 
  Mail, 
  Phone, 
  Upload,
  AlertCircle,
  Search,
  MoreHorizontal,
  Plus,
  FileMusic,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ProjectType = "single" | "ep" | "album" | "";

interface Track {
  id: string;
  title: string;
  mixFileLink: string;
  isrc?: string;
}

interface MasteringProject {
  id: string;
  title: string;
  artist: string;
  type: ProjectType;
  tracks: number;
  status: "pending" | "in-progress" | "completed";
  date: string;
}

const mockProjects: MasteringProject[] = [
  {
    id: "1",
    title: "The Zoonotics Friendly LP - MASTERS",
    artist: "Lachlan Carrick",
    type: "album",
    tracks: 12,
    status: "completed",
    date: "2 days ago"
  },
  {
    id: "2",
    title: "Allara-Monika DOJ MASTERS",
    artist: "Lachlan Carrick",
    type: "single",
    tracks: 1,
    status: "completed",
    date: "2 days ago"
  },
  {
    id: "3",
    title: "Moon Elevator - The Shadow That Follows You Home EP - MASTERS",
    artist: "Lachlan Carrick",
    type: "ep",
    tracks: 6,
    status: "in-progress",
    date: "4 days ago"
  }
];

export function LibraryView() {
  const [activeTab, setActiveTab] = useState("mine");
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [projectType, setProjectType] = useState<ProjectType>("");
  const [numTracks, setNumTracks] = useState<number>(1);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [hasISRCs, setHasISRCs] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [isRush, setIsRush] = useState(false);
  const [projectNotes, setProjectNotes] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const { toast } = useToast();

  // Auto-fill track count based on project type
  useEffect(() => {
    if (projectType === "single") {
      setNumTracks(1);
    } else if (projectType === "ep") {
      setNumTracks(4);
    } else if (projectType === "album") {
      setNumTracks(10);
    }
  }, [projectType]);

  // Update tracks array when number of tracks changes
  useEffect(() => {
    const newTracks: Track[] = [];
    for (let i = 0; i < numTracks; i++) {
      const existingTrack = tracks[i];
      newTracks.push({
        id: `track-${i + 1}`,
        title: existingTrack?.title || "",
        mixFileLink: existingTrack?.mixFileLink || "",
        isrc: existingTrack?.isrc || "",
      });
    }
    setTracks(newTracks);
  }, [numTracks]);

  const updateTrack = (index: number, field: keyof Track, value: string) => {
    const updatedTracks = [...tracks];
    updatedTracks[index] = { ...updatedTracks[index], [field]: value };
    setTracks(updatedTracks);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectType || !email || !projectTitle || !artistName || tracks.some(track => !track.title)) {
      toast({
        title: "Please fill in all required fields",
        description: "All fields marked with * are required.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Project submitted successfully!",
      description: "We'll get back to you soon with a quote and timeline.",
    });

    // Reset form
    setShowNewProjectForm(false);
    setProjectType("");
    setProjectTitle("");
    setArtistName("");
    setNumTracks(1);
    setTracks([]);
    setHasISRCs(false);
    setDeadline("");
    setIsRush(false);
    setProjectNotes("");
    setEmail("");
    setPhone("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case "in-progress":
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">In Progress</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">Pending</Badge>;
      default:
        return null;
    }
  };

  if (showNewProjectForm) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">New Mastering Project</h1>
            <p className="text-muted-foreground">Submit your tracks for professional mastering</p>
          </div>
          <Button variant="outline" onClick={() => setShowNewProjectForm(false)}>
            Back to Library
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          {/* Project Details */}
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="project-title">Project Title *</Label>
                  <Input
                    id="project-title"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Enter project title"
                    className="bg-input border-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artist-name">Artist Name *</Label>
                  <Input
                    id="artist-name"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="Enter artist name"
                    className="bg-input border-border"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="project-type">Project Type *</Label>
                  <Select value={projectType} onValueChange={(value) => setProjectType(value as ProjectType)}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="ep">EP</SelectItem>
                      <SelectItem value="album">Album</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="num-tracks">Number of Tracks</Label>
                  <Input
                    id="num-tracks"
                    type="number"
                    min="1"
                    max="50"
                    value={numTracks}
                    onChange={(e) => setNumTracks(parseInt(e.target.value) || 1)}
                    className="bg-input border-border"
                  />
                </div>
              </div>

              {/* Track List */}
              {tracks.length > 0 && (
                <div className="space-y-4 animate-fade-in">
                  <Label>Track List *</Label>
                  <div className="space-y-4">
                    {tracks.map((track, index) => (
                      <Card key={track.id} className="p-4 bg-accent/30 border-border">
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor={`track-title-${index}`}>
                                {index + 1}. Song Title *
                              </Label>
                              <Input
                                id={`track-title-${index}`}
                                value={track.title}
                                onChange={(e) => updateTrack(index, "title", e.target.value)}
                                placeholder={`Track ${index + 1} title`}
                                className="bg-input border-border"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`mix-file-${index}`}>
                                Mix File Link
                              </Label>
                              <Input
                                id={`mix-file-${index}`}
                                value={track.mixFileLink}
                                onChange={(e) => updateTrack(index, "mixFileLink", e.target.value)}
                                placeholder="Dropbox/Drive link or file URL"
                                className="bg-input border-border"
                              />
                            </div>
                          </div>
                          
                          {hasISRCs && (
                            <div className="animate-fade-in">
                              <Label htmlFor={`isrc-${index}`}>ISRC Code</Label>
                              <Input
                                id={`isrc-${index}`}
                                value={track.isrc || ""}
                                onChange={(e) => updateTrack(index, "isrc", e.target.value)}
                                placeholder="US-ABC-XX-XXXXX"
                                className="bg-input border-border"
                              />
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* ISRC Toggle */}
              <div className="flex items-center space-x-3 p-4 bg-accent/20 rounded-lg border border-border">
                <Switch
                  id="has-isrcs"
                  checked={hasISRCs}
                  onCheckedChange={setHasISRCs}
                />
                <div className="space-y-1">
                  <Label htmlFor="has-isrcs" className="text-sm font-medium">
                    Do you have ISRCs?
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    International Standard Recording Codes for digital distribution
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Requirements */}
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Timeline & Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Preferred Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>

                <div className="flex items-center space-x-3 p-4 bg-accent/20 rounded-lg border border-border">
                  <Checkbox
                    id="rush"
                    checked={isRush}
                    onCheckedChange={(checked) => setIsRush(checked === true)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="rush" className="text-sm font-medium">
                      Rush order?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Need it faster than usual turnaround
                    </p>
                  </div>
                </div>
              </div>

              {isRush && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg animate-fade-in">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-primary">
                        Rush Surcharge May Apply
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        We'll confirm pricing and availability for expedited delivery.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Project Notes / Preferences</Label>
                <Textarea
                  id="notes"
                  value={projectNotes}
                  onChange={(e) => setProjectNotes(e.target.value)}
                  placeholder="Tell us about your artistic vision, reference tracks, specific requirements, or any other details..."
                  rows={4}
                  className="bg-input border-border"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-gradient-card shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-10 bg-input border-border"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="pl-10 bg-input border-border"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button 
              type="submit" 
              size="lg" 
              className="bg-gradient-primary hover:shadow-elegant transition-all duration-300 px-8"
            >
              <Upload className="h-4 w-4 mr-2" />
              Submit Project Request
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Library</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-10 w-64 bg-input border-border"
            />
          </div>
          <Button 
            onClick={() => setShowNewProjectForm(true)}
            className="bg-gradient-primary hover:shadow-elegant transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-accent border-border">
          <TabsTrigger value="mine" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Mine
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Shared with me
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select defaultValue="recent">
                <SelectTrigger className="w-40 bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Last accessed</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="date">Date created</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {mockProjects.map((project) => (
              <Card key={project.id} className="bg-gradient-card shadow-card border-border hover:bg-accent/30 transition-all duration-200 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileMusic className="h-6 w-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <h3 className="font-medium text-foreground truncate">{project.title}</h3>
                          <p className="text-sm text-muted-foreground">{project.artist}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          {getStatusBadge(project.status)}
                          <span className="text-sm text-muted-foreground">{project.date}</span>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No shared projects</h3>
            <p className="text-muted-foreground">Projects shared with you will appear here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}