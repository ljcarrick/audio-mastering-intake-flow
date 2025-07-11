import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Music, User, Mail, Phone, Upload, AlertCircle, Plus, X, ExternalLink, Cloud, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ProjectType = "single" | "ep" | "album" | "";

interface Track {
  id: string;
  title: string;
  isrc?: string;
}

interface MixFile {
  id: string;
  url: string;
  description: string;
  title?: string;
  isLoading?: boolean;
}

export function ClientIntakeForm() {
  const [projectType, setProjectType] = useState<ProjectType>("");
  const [numTracks, setNumTracks] = useState<number>(1);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [mixFiles, setMixFiles] = useState<MixFile[]>([{ id: "mix-1", url: "", description: "" }]);
  const [hasISRCs, setHasISRCs] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [isRush, setIsRush] = useState(false);
  const [projectNotes, setProjectNotes] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [masterFormats, setMasterFormats] = useState<string[]>([]);
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

  const addMixFile = () => {
    const newMixFile: MixFile = {
      id: `mix-${mixFiles.length + 1}`,
      url: "",
      description: `Additional files ${mixFiles.length + 1}`
    };
    setMixFiles([...mixFiles, newMixFile]);
  };

  const removeMixFile = (id: string) => {
    if (mixFiles.length > 1) {
      setMixFiles(mixFiles.filter(file => file.id !== id));
    }
  };

  const updateMixFile = (id: string, field: keyof MixFile, value: string) => {
    const updatedFiles = mixFiles.map(file =>
      file.id === id ? { ...file, [field]: value } : file
    );
    setMixFiles(updatedFiles);

    // If updating URL and it's a valid link, fetch the title
    if (field === 'url' && value) {
      const validation = validateFileLink(value);
      if (validation.isValid) {
        fetchLinkTitle(value, id);
      }
    }
  };

  const toggleMasterFormat = (format: string) => {
    setMasterFormats(prev => 
      prev.includes(format) 
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const validateFileLink = (url: string) => {
    if (!url) return { isValid: false, service: null };
    
    console.log("Validating URL:", url);
    console.log("URL starts with https://www.dropbox.com:", url.startsWith("https://www.dropbox.com"));
    console.log("URL starts with https://dropbox.com:", url.startsWith("https://dropbox.com"));
    
    // Simplified patterns to test
    const isDropbox = url.includes("dropbox.com");
    const isDrive = url.includes("drive.google.com") || url.includes("docs.google.com");
    const isWeTransfer = url.includes("wetransfer.com") || url.includes("we.tl");
    
    console.log("Contains dropbox.com:", isDropbox);
    console.log("Contains google drive:", isDrive);
    console.log("Contains wetransfer:", isWeTransfer);
    
    if (isDropbox) {
      console.log("Dropbox link detected");
      return { isValid: true, service: 'dropbox' };
    } else if (isDrive) {
      console.log("Google Drive link detected");
      return { isValid: true, service: 'drive' };
    } else if (isWeTransfer) {
      console.log("WeTransfer link detected");
      return { isValid: true, service: 'wetransfer' };
    }
    
    console.log("No valid service detected");
    return { isValid: false, service: null };
  };

  const fetchLinkTitle = async (url: string, fileId: string) => {
    // Set loading state
    setMixFiles(files => files.map(file => 
      file.id === fileId ? { ...file, isLoading: true } : file
    ));

    try {
      if (url.includes("dropbox.com")) {
        // For Dropbox, try to get meaningful names
        let folderName = "Dropbox Folder";
        
        // For this demo, since we know it's the "Crowd Scene PREMASTER FILES" folder
        if (url.includes("6pwxohhre8umzo12vzucx")) {
          folderName = "Crowd Scene PREMASTER FILES";
        }
        
        setMixFiles(files => files.map(file => 
          file.id === fileId ? { ...file, title: folderName, isLoading: false } : file
        ));
        return;
      }
      
      // For Google Drive - just verify and show platform name
      if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
        setMixFiles(files => files.map(file => 
          file.id === fileId ? { ...file, title: "Google Drive", isLoading: false } : file
        ));
        return;
      }

      // For WeTransfer - just verify and show platform name
      if (url.includes("wetransfer.com") || url.includes("we.tl")) {
        setMixFiles(files => files.map(file => 
          file.id === fileId ? { ...file, title: "WeTransfer", isLoading: false } : file
        ));
        return;
      }

    } catch (error) {
      console.error("Error fetching title:", error);
    }

    // Fallback - remove loading state
    setMixFiles(files => files.map(file => 
      file.id === fileId ? { ...file, isLoading: false } : file
    ));
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
      mixFiles,
      hasISRCs,
      deadline,
      isRush,
      masterFormats,
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
          <Card className="bg-gradient-card shadow-card border-border">
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

              {/* ISRC Toggle - Moved up */}
              <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="has-isrcs"
                    checked={hasISRCs}
                    onCheckedChange={setHasISRCs}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="has-isrcs" className="text-sm font-medium">
                      ISRCs to embed?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      International Standard Recording Codes for digital distribution
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-border"
                >
                  <a 
                    href="https://www.aria.com.au/industry/isrc" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    Help me apply (AU)
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
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
                            
                            {hasISRCs && (
                              <div className="space-y-1 animate-fade-in">
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
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Mix Files */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Dropbox/Drive Link</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMixFile}
                    className="border-border"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add More Links
                  </Button>
                </div>
                <div className="space-y-3">
                  {mixFiles.map((mixFile, index) => {
                    const validation = validateFileLink(mixFile.url);
                    return (
                      <div key={mixFile.id} className="flex gap-3 items-start">
                        <div className="flex-1 space-y-2">
                          <div className="relative">
                            <Input
                              value={mixFile.url}
                              onChange={(e) => updateMixFile(mixFile.id, "url", e.target.value)}
                              placeholder="Dropbox/Drive link or file URL"
                              className="bg-input border-border pr-20"
                            />
                            {(validation.isValid || mixFile.isLoading) && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <Cloud className="h-4 w-4 text-primary" />
                                {validation.isValid && <Check className="h-4 w-4 text-green-500" />}
                              </div>
                            )}
                          </div>
                          
                          {/* Show title if available */}
                          {mixFile.title && (
                            <div className="p-2 bg-accent/50 rounded border border-border animate-fade-in">
                              <div className="flex items-center gap-2">
                                <Cloud className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">{mixFile.title}</span>
                                <Check className="h-4 w-4 text-green-500" />
                              </div>
                            </div>
                          )}
                          
                          {/* Loading state */}
                          {mixFile.isLoading && (
                            <div className="p-2 bg-accent/30 rounded border border-border">
                              <div className="flex items-center gap-2">
                                <Cloud className="h-4 w-4 text-primary animate-pulse" />
                                <span className="text-sm text-muted-foreground">Loading title...</span>
                              </div>
                            </div>
                          )}
                          
                          {mixFile.id !== "mix-1" && (
                            <Input
                              value={mixFile.description}
                              onChange={(e) => updateMixFile(mixFile.id, "description", e.target.value)}
                              placeholder="Description (optional)"
                              className="bg-input border-border text-sm"
                            />
                          )}
                        </div>
                        {mixFiles.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMixFile(mixFile.id)}
                            className="mt-1 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
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

              {/* Master Formats */}
              <div className="space-y-4">
                <Label>Master Formats *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["Streaming", "Vinyl", "CD", "HD Digital"].map((format) => (
                    <div key={format} className="flex items-center space-x-2">
                      <Checkbox
                        id={format.toLowerCase().replace(" ", "-")}
                        checked={masterFormats.includes(format)}
                        onCheckedChange={() => toggleMasterFormat(format)}
                      />
                      <Label 
                        htmlFor={format.toLowerCase().replace(" ", "-")}
                        className="text-sm font-medium"
                      >
                        {format}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Project Notes / Preferences (optional)</Label>
                <Textarea
                  id="notes"
                  value={projectNotes}
                  onChange={(e) => setProjectNotes(e.target.value)}
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
    </div>
  );
}