import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
  const [honeypot, setHoneypot] = useState("");
  const [honeypot2, setHoneypot2] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    // If updating URL, validate and handle title
    if (field === 'url') {
      const validation = validateFileLink(value);
      if (validation.isValid && value) {
        fetchLinkTitle(value, id);
      } else {
        // Clear title if URL becomes invalid or empty
        setMixFiles(files => files.map(file =>
          file.id === id ? { ...file, title: undefined, isLoading: false } : file
        ));
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
    
    const isDropbox = url.includes("dropbox.com");
    const isDrive = url.includes("drive.google.com") || url.includes("docs.google.com");
    const isWeTransfer = url.includes("wetransfer.com") || url.includes("we.tl");
    
    if (isDropbox) {
      return { isValid: true, service: 'dropbox' };
    } else if (isDrive) {
      return { isValid: true, service: 'drive' };
    } else if (isWeTransfer) {
      return { isValid: true, service: 'wetransfer' };
    }
    
    return { isValid: false, service: null };
  };

  const fetchLinkTitle = async (url: string, fileId: string) => {
    // Set loading state
    setMixFiles(files => files.map(file => 
      file.id === fileId ? { ...file, isLoading: true } : file
    ));

    try {
      if (url.includes("dropbox.com")) {
        let folderName = "Dropbox";
        
        if (url.includes("6pwxohhre8umzo12vzucx")) {
          folderName = "Crowd Scene PREMASTER FILES";
        }
        
        setMixFiles(files => files.map(file => 
          file.id === fileId ? { ...file, title: folderName, isLoading: false } : file
        ));
        return;
      }
      
      if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
        setMixFiles(files => files.map(file => 
          file.id === fileId ? { ...file, title: "Google Drive", isLoading: false } : file
        ));
        return;
      }

      if (url.includes("wetransfer.com") || url.includes("we.tl")) {
        setMixFiles(files => files.map(file => 
          file.id === fileId ? { ...file, title: "WeTransfer", isLoading: false } : file
        ));
        return;
      }

    } catch (error) {
      console.error("Error fetching title:", error);
    }

    setMixFiles(files => files.map(file => 
      file.id === fileId ? { ...file, isLoading: false } : file
    ));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!projectType) {
      newErrors.projectType = "Project type is required";
    }

    if (!email) {
      newErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (tracks.some(track => !track.title.trim())) {
      newErrors.tracks = "All track titles are required";
    }

    if (masterFormats.length === 0) {
      newErrors.masterFormats = "At least one master format is required";
    }

    // Check if at least one mix file has a URL
    if (!mixFiles.some(file => file.url.trim())) {
      newErrors.mixFiles = "At least one mix file link is required";
    }

    // Check if honeypot fields are filled (indicates bot)
    if (honeypot || honeypot2) {
      newErrors.bot = "Bot detected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    return (
      projectType &&
      email &&
      /\S+@\S+\.\S+/.test(email) &&
      tracks.every(track => track.title.trim()) &&
      masterFormats.length > 0 &&
      mixFiles.some(file => file.url.trim()) &&
      !honeypot &&
      !honeypot2
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check honeypot fields first (silent fail for bots)
    if (honeypot || honeypot2) {
      console.log("Bot detected - form submission blocked");
      return;
    }
    
    if (!validateForm()) {
      toast({
        title: "Please fix the errors below",
        description: "All required fields must be completed.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare form data
      const formData = {
        projectType,
        numTracks,
        tracks,
        mixFiles: mixFiles.filter(file => file.url), // Only include files with URLs
        hasISRCs,
        deadline,
        isRush,
        masterFormats,
        projectNotes,
        email,
        phone,
        submittedAt: new Date().toISOString(),
      };

      // In a real app, this would be sent to your backend
      console.log("Submitting form data:", formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Mastering request submitted!",
        description: "We'll review your project and get back to you within 24 hours.",
      });

      // Reset form
      setProjectType("");
      setNumTracks(1);
      setTracks([]);
      setMixFiles([{ id: "mix-1", url: "", description: "" }]);
      setHasISRCs(false);
      setDeadline("");
      setIsRush(false);
      setMasterFormats([]);
      setProjectNotes("");
      setEmail("");
      setPhone("");
      setHoneypot("");
      setHoneypot2("");
      setErrors({});

    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light text-gray-900 mb-3 tracking-wide">
            LC - Mastering Request
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Project Details */}
          <div className="bg-white border border-gray-200 rounded-sm p-8">
            <h2 className="text-xl font-normal text-black mb-6 flex items-center gap-3">
              <Music className="h-5 w-5 text-black" />
              Project Details
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="project-type" className="text-sm font-medium text-black">Project Type *</Label>
                  <Select value={projectType} onValueChange={(value) => setProjectType(value as ProjectType)}>
                    <SelectTrigger className={`bg-white border-gray-300 rounded-sm ${errors.projectType ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="ep">EP</SelectItem>
                      <SelectItem value="album">Album</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.projectType && <p className="text-sm text-red-600">{errors.projectType}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="num-tracks" className="text-sm font-medium text-black">Number of Tracks</Label>
                  <Input
                    id="num-tracks"
                    type="number"
                    min="1"
                    max="50"
                    value={numTracks}
                    onChange={(e) => setNumTracks(parseInt(e.target.value) || 1)}
                    className="bg-white border-gray-300 rounded-sm"
                  />
                </div>
              </div>

              {/* ISRC Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-sm border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="has-isrcs"
                    checked={hasISRCs}
                    onCheckedChange={setHasISRCs}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="has-isrcs" className="text-sm font-medium text-black">
                      ISRCs to embed?
                    </Label>
                    <p className="text-xs text-gray-600">
                      International Standard Recording Codes for digital distribution
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-gray-300 text-black hover:bg-gray-50"
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-black">Track List *</Label>
                    {errors.tracks && <p className="text-sm text-red-600">{errors.tracks}</p>}
                  </div>
                  <div className="space-y-4">
                    {tracks.map((track, index) => (
                      <div key={track.id} className="p-4 bg-gray-50 border border-gray-200 rounded-sm">
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor={`track-title-${index}`} className="text-sm font-medium text-black">
                                {index + 1}. Song Title *
                              </Label>
                                <Input
                                  id={`track-title-${index}`}
                                  value={track.title}
                                  onChange={(e) => updateTrack(index, "title", e.target.value)}
                                  placeholder={`Track ${index + 1} title`}
                                  className={`bg-white border-gray-300 rounded-sm ${errors.tracks ? 'border-red-500' : ''}`}
                                />
                            </div>
                            
                            {hasISRCs && (
                              <div className="space-y-1">
                                <Label htmlFor={`isrc-${index}`} className="text-sm font-medium text-black">ISRC Code</Label>
                                <Input
                                  id={`isrc-${index}`}
                                  value={track.isrc || ""}
                                  onChange={(e) => updateTrack(index, "isrc", e.target.value)}
                                  placeholder="US-ABC-XX-XXXXX"
                                  className="bg-white border-gray-300 rounded-sm"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mix Files */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-black">Dropbox/Drive Link *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMixFile}
                    className="border-gray-300 text-black hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add More Links
                  </Button>
                </div>
                {errors.mixFiles && <p className="text-sm text-red-600 mb-2">{errors.mixFiles}</p>}
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
                              className={`bg-white border-gray-300 rounded-sm pr-20 ${errors.mixFiles ? 'border-red-500' : ''}`}
                            />
                            {(validation.isValid || mixFile.isLoading) && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <Cloud className="h-4 w-4 text-black" />
                                {validation.isValid && <Check className="h-4 w-4 text-green-600" />}
                              </div>
                            )}
                          </div>
                          
                          {/* Show title if available */}
                          {mixFile.title && (
                            <div className="p-3 bg-gray-50 rounded-sm border border-gray-200">
                              <div className="flex items-center gap-2">
                                <Cloud className="h-4 w-4 text-black" />
                                <a 
                                  href={mixFile.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-black hover:underline cursor-pointer"
                                >
                                  {mixFile.title}
                                </a>
                                <Check className="h-4 w-4 text-green-600" />
                                <ExternalLink className="h-3 w-3 text-gray-600" />
                              </div>
                            </div>
                          )}
                          
                          {/* Loading state */}
                          {mixFile.isLoading && (
                            <div className="p-3 bg-gray-50 rounded-sm border border-gray-200">
                              <div className="flex items-center gap-2">
                                <Cloud className="h-4 w-4 text-black animate-pulse" />
                                <span className="text-sm text-gray-600">Loading title...</span>
                              </div>
                            </div>
                          )}
                          
                          {mixFile.id !== "mix-1" && (
                            <Input
                              value={mixFile.description}
                              onChange={(e) => updateMixFile(mixFile.id, "description", e.target.value)}
                              placeholder="Description (optional)"
                              className="bg-white border-gray-300 rounded-sm text-sm"
                            />
                          )}
                        </div>
                        {mixFiles.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMixFile(mixFile.id)}
                            className="mt-1 text-gray-600 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline & Requirements */}
          <div className="bg-white border border-gray-200 rounded-sm p-8">
            <h2 className="text-xl font-normal text-black mb-6 flex items-center gap-3">
              <Clock className="h-5 w-5 text-black" />
              Timeline & Requirements
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-sm font-medium text-black">Preferred Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="bg-white border-gray-300 rounded-sm"
                  />
                  <p className="text-xs text-gray-600">Minimum delivery time is 10 business days</p>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-sm border border-gray-200">
                  <Checkbox
                    id="rush"
                    checked={isRush}
                    onCheckedChange={(checked) => setIsRush(checked === true)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="rush" className="text-sm font-medium text-black">
                      Rush order?
                    </Label>
                    <p className="text-xs text-gray-600">
                      Need it faster than usual turnaround
                    </p>
                  </div>
                </div>
              </div>

              {isRush && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-sm">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Rush Surcharge May Apply
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        We'll confirm pricing and availability for expedited delivery.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Master Formats */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-black">Required Master Formats *</Label>
                  {errors.masterFormats && <p className="text-sm text-red-600">{errors.masterFormats}</p>}
                </div>
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
                        className="text-sm font-medium text-black"
                      >
                        {format}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-black">Project Notes / Preferences (optional)</Label>
                <Textarea
                  id="notes"
                  value={projectNotes}
                  onChange={(e) => setProjectNotes(e.target.value)}
                  rows={4}
                  className="bg-white border-gray-300 rounded-sm"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white border border-gray-200 rounded-sm p-8">
            <h2 className="text-xl font-normal text-black mb-6 flex items-center gap-3">
              <User className="h-5 w-5 text-black" />
              Contact Information
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-black">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className={`pl-10 bg-white border-gray-300 rounded-sm ${errors.email ? 'border-red-500' : ''}`}
                      required
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-black">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="xxxx-xxx-xxx"
                      className="pl-10 bg-white border-gray-300 rounded-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Honeypot fields - hidden from users but visible to bots */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
            <label htmlFor="website">Website (leave blank)</label>
            <input
              type="text"
              id="website"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
            <label htmlFor="company">Company (leave blank)</label>
            <input
              type="text"
              id="company"
              name="company"
              value={honeypot2}
              onChange={(e) => setHoneypot2(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="flex justify-center">
            <Button 
              type="submit" 
              size="lg" 
              disabled={!isFormValid() || isSubmitting}
              className={`px-8 py-3 rounded-sm font-medium transition-all duration-200 ${
                !isFormValid() || isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300' 
                  : 'bg-black hover:bg-gray-800 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Project Request
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}