import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Music, User, Mail, Phone, Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ProjectType = "single" | "ep" | "album" | "";

interface Track {
  id: string;
  title: string;
  mixFileLink: string;
  isrc?: string;
}

export function ClientIntakeForm() {
  const [projectType, setProjectType] = useState<ProjectType>("");
  const [numTracks, setNumTracks] = useState<number>(1);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [hasISRCs, setHasISRCs] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [isRush, setIsRush] = useState(false);
  const [projectNotes, setProjectNotes] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
    
    // Basic validation
    if (!projectType || !email || tracks.some(track => !track.title)) {
      toast({
        title: "Please fill in all required fields",
        description: "Project type, email, and all track titles are required.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Form submitted successfully!",
      description: "We'll get back to you soon with a quote and timeline.",
    });

    console.log("Form data:", {
      projectType,
      numTracks,
      tracks,
      hasISRCs,
      deadline,
      isRush,
      projectNotes,
      email,
      phone,
    });
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Audio Mastering Services
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Professional mastering for your music project
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Details */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                Project Details
              </CardTitle>
              <CardDescription>
                Tell us about your music project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="project-type">Project Type *</Label>
                  <Select value={projectType} onValueChange={(value) => setProjectType(value as ProjectType)}>
                    <SelectTrigger>
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
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Track List */}
              {tracks.length > 0 && (
                <div className="space-y-4 animate-fade-in">
                  <Label>Track List *</Label>
                  <div className="space-y-4">
                    {tracks.map((track, index) => (
                      <Card key={track.id} className="p-4 bg-accent/30">
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
                                className="bg-background"
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
                                className="bg-background"
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
                                className="bg-background"
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
              <div className="flex items-center space-x-3 p-4 bg-accent/20 rounded-lg">
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
          <Card className="bg-gradient-card shadow-card">
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
                    className="bg-background"
                  />
                </div>

                <div className="flex items-center space-x-3 p-4 bg-accent/20 rounded-lg">
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
                  className="bg-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-gradient-card shadow-card">
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
                      className="pl-10 bg-background"
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
                      className="pl-10 bg-background"
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
    </div>
  );
}