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
import emailjs from '@emailjs/browser';

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

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  billTo: boolean;
}

interface BillingInfo {
  name: string;
  email: string;
  company: string;
}

export function ClientIntakeForm() {
  const [projectType, setProjectType] = useState<ProjectType>("");
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [numTracks, setNumTracks] = useState<number>(1);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [mixFiles, setMixFiles] = useState<MixFile[]>([{ id: "mix-1", url: "", description: "" }]);
  const [hasISRCs, setHasISRCs] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [isRush, setIsRush] = useState(false);
  const [projectNotes, setProjectNotes] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([
    { id: "contact-1", name: "", email: "", phone: "", role: "", billTo: false }
  ]);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({ name: "", email: "", company: "" });
  const [masterFormats, setMasterFormats] = useState<string[]>([]);
  const [honeypot, setHoneypot] = useState("");
  const [honeypot2, setHoneypot2] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  type ISRCChunk = [string, string, string, string];
  const [isrcChunks, setIsrcChunks] = useState<ISRCChunk[]>([]);

  useEffect(() => {
    setIsrcChunks(Array.from({ length: numTracks }, () => ["", "", "", ""]));
  }, [numTracks]);

  const handleISRCInput = (trackIdx: number, chunkIdx: number, input: string) => {
    const cleaned = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const updated = [...isrcChunks];

    if (cleaned.length === 12) {
      updated[trackIdx] = [
        cleaned.slice(0, 2),
        cleaned.slice(2, 5),
        cleaned.slice(5, 7),
        cleaned.slice(7, 12),
      ];
    } else {
      updated[trackIdx][chunkIdx] = cleaned;
    }

    setIsrcChunks(updated);
  };

  const autoFillISRCs = () => {
    const [cc, reg, yr, baseNumStr] = isrcChunks[0];
    if ([cc, reg, yr, baseNumStr].some(part => part === '')) {
      alert("Please complete the first ISRC to auto-fill.");
      return;
    }

    const baseNum = parseInt(baseNumStr, 10);
    const filled = Array.from({ length: numTracks }, (_, i) => {
      const newNum = (baseNum + i).toString().padStart(5, '0');
      return [cc, reg, yr, newNum] as ISRCChunk;
    });

    setIsrcChunks(filled);
  };

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
    
    // Special handling for ISRC field
    if (field === 'isrc') {
      // Allow input up to 15 characters (including dashes), then clean to 12
      if (value.length <= 15) {
        // Remove all dashes and non-alphanumeric characters, keep only letters and numbers
        const cleanValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        // Limit to exactly 12 characters
        const limitedValue = cleanValue.slice(0, 12);
        updatedTracks[index] = { ...updatedTracks[index], [field]: limitedValue };
      }
    } else {
      updatedTracks[index] = { ...updatedTracks[index], [field]: value };
    }
    
    setTracks(updatedTracks);
  };

  const addContact = () => {
    const newContact: Contact = {
      id: `contact-${contacts.length + 1}`,
      name: "",
      email: "",
      phone: "",
      role: "",
      billTo: false
    };
    setContacts([...contacts, newContact]);
  };

  const removeContact = (id: string) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter(contact => contact.id !== id));
    }
  };

  const updateContact = (id: string, field: keyof Contact, value: string | boolean) => {
    const updatedContacts = contacts.map(contact => {
      if (contact.id === id) {
        const updatedContact = { ...contact, [field]: value };
        
        // If billTo is being set to true, set all others to false and copy data to billing
        if (field === 'billTo' && value === true) {
          // First set all other contacts' billTo to false
          const resetContacts = contacts.map(c => ({ ...c, billTo: false }));
          const finalContacts = resetContacts.map(c => 
            c.id === id ? updatedContact : c
          );
          
          // Copy contact data to billing info
          setBillingInfo({
            name: updatedContact.name,
            email: updatedContact.email,
            company: ""
          });
          
          return updatedContact;
        }
        
        return updatedContact;
      }
      return contact;
    });
    
    setContacts(updatedContacts);
  };

  const updateBillingInfo = (field: keyof BillingInfo, value: string) => {
    setBillingInfo(prev => ({ ...prev, [field]: value }));
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

    if (!artist.trim()) {
      newErrors.artist = "Artist name is required";
    }

    if (projectType !== "single" && !title.trim()) {
      newErrors.title = `${projectType === "ep" ? "EP" : "Album"} title is required`;
    }

    // Validate contacts
    if (contacts.length === 0) {
      newErrors.contacts = "At least one contact is required";
    } else {
      const hasValidContact = contacts.some(contact => 
        contact.name.trim() && contact.email.trim() && /\S+@\S+\.\S+/.test(contact.email)
      );
      if (!hasValidContact) {
        newErrors.contacts = "At least one contact must have a name and valid email";
      }
    }

    if (!billingInfo.name.trim()) {
      newErrors.billingName = "Billing name is required";
    }

    if (!billingInfo.email) {
      newErrors.billingEmail = "Billing email is required";
    } else if (!/\S+@\S+\.\S+/.test(billingInfo.email)) {
      newErrors.billingEmail = "Please enter a valid billing email address";
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
    const hasValidContact = contacts.some(contact => 
      contact.name.trim() && contact.email.trim() && /\S+@\S+\.\S+/.test(contact.email)
    );
    
    return (
      projectType &&
      artist.trim() &&
      (projectType === "single" || title.trim()) &&
      hasValidContact &&
      billingInfo.name.trim() &&
      billingInfo.email &&
      /\S+@\S+\.\S+/.test(billingInfo.email) &&
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
      // Create rich HTML email content
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', system-ui, sans-serif; line-height: 1.6; color: #111827; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: #111827; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 1px; }
        .section { padding: 25px; border-bottom: 1px solid #e5e7eb; }
        .section:last-child { border-bottom: none; }
        .section-title { font-size: 18px; font-weight: 500; color: #111827; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
        .field-group { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
        .field { }
        .field-label { font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .field-value { font-size: 14px; color: #111827; font-weight: 400; }
        .track-list { margin-top: 10px; }
        .track-item { background: #f9fafb; padding: 12px; margin-bottom: 8px; border-radius: 6px; border-left: 3px solid #111827; }
        .track-number { font-weight: 600; color: #111827; }
        .formats-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .format-tag { background: #111827; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
        .file-link { color: #2563eb; text-decoration: none; word-break: break-all; }
        .file-link:hover { text-decoration: underline; }
        .rush-badge { background: #fef3c7; color: #92400e; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; display: inline-block; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        @media (max-width: 600px) {
            .field-group { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LC - Mastering Request</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.8;">${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</p>
        </div>
        
        <div class="section">
            <div class="section-title">🎵 Project Details</div>
            <div class="field-group">
                <div class="field">
                    <div class="field-label">Artist</div>
                    <div class="field-value">${artist}</div>
                </div>
                ${title ? `
                <div class="field">
                    <div class="field-label">${projectType === "ep" ? "EP" : projectType === "album" ? "Album" : "Project"} Title</div>
                    <div class="field-value">${title}</div>
                </div>` : ''}
            </div>
            <div class="field-group">
                <div class="field">
                    <div class="field-label">Project Type</div>
                    <div class="field-value">${projectType.toUpperCase()}</div>
                </div>
                <div class="field">
                    <div class="field-label">Number of Tracks</div>
                    <div class="field-value">${numTracks}</div>
                </div>
            </div>
            ${deadline ? `
            <div class="field-group">
                <div class="field">
                    <div class="field-label">Preferred Deadline</div>
                    <div class="field-value">${new Date(deadline).toLocaleDateString()}</div>
                </div>
                <div class="field">
                    <div class="field-label">Priority</div>
                    <div class="field-value">${isRush ? '<span class="rush-badge">Rush Order</span>' : 'Standard'}</div>
                </div>
            </div>` : isRush ? `
            <div class="field">
                <div class="field-label">Priority</div>
                <div class="field-value"><span class="rush-badge">Rush Order</span></div>
            </div>` : ''}
        </div>

        <div class="section">
            <div class="section-title">🎼 Track List / Order</div>
            <div class="track-list">
                ${tracks.map((track, i) => `
                <div class="track-item">
                    <span class="track-number">${i + 1}.</span> ${track.title}
                    ${hasISRCs && track.isrc ? `<br><small style="color: #6b7280;">ISRC: ${track.isrc}</small>` : ''}
                </div>`).join('')}
            </div>
        </div>

        <div class="section">
            <div class="section-title">📁 Project Files</div>
            ${mixFiles.filter(file => file.url).map((file, i) => `
            <div style="margin-bottom: 12px;">
                <div class="field-label">File ${i + 1}</div>
                <div class="field-value">
                    <a href="${file.url}" class="file-link" target="_blank">${file.url}</a>
                    ${file.description ? `<br><small style="color: #6b7280;">${file.description}</small>` : ''}
                </div>
            </div>`).join('')}
        </div>

        <div class="section">
            <div class="section-title">🎚️ Required Master Formats</div>
            <div class="formats-list">
                ${masterFormats.map(format => `<span class="format-tag">${format}</span>`).join('')}
            </div>
            ${hasISRCs ? '<p style="margin-top: 12px; font-size: 14px; color: #6b7280;">✓ Client has ISRC codes to embed</p>' : ''}
        </div>

         <div class="section">
            <div class="section-title">📞 Contact Information</div>
            ${contacts.filter(c => c.name || c.email).map(c => `
            <div style="margin-bottom: 16px; padding: 12px; background: #f9fafb; border-radius: 6px;">
                <div class="field-group">
                    <div class="field">
                        <div class="field-label">Name</div>
                        <div class="field-value">${c.name || 'Not provided'}</div>
                    </div>
                    <div class="field">
                        <div class="field-label">Email</div>
                        <div class="field-value"><a href="mailto:${c.email}" style="color: #2563eb;">${c.email || 'Not provided'}</a></div>
                    </div>
                </div>
                <div class="field-group">
                    <div class="field">
                        <div class="field-label">Phone</div>
                        <div class="field-value">${c.phone ? `<a href="tel:${c.phone}" style="color: #2563eb;">${c.phone}</a>` : 'Not provided'}</div>
                    </div>
                    <div class="field">
                        <div class="field-label">Role</div>
                        <div class="field-value">${c.role || 'Not specified'}</div>
                    </div>
                </div>
                ${c.billTo ? '<p style="margin-top: 8px; font-size: 12px; color: #6b7280; font-weight: 500;">📧 Billing Contact</p>' : ''}
            </div>
            `).join('')}
         </div>

         <div class="section">
             <div class="section-title">💳 Billing Information</div>
             <div class="field-group">
                 <div class="field">
                     <div class="field-label">Billing Name</div>
                     <div class="field-value">${billingInfo.name || 'Not provided'}</div>
                 </div>
                 <div class="field">
                     <div class="field-label">Billing Email</div>
                     <div class="field-value">${billingInfo.email ? `<a href="mailto:${billingInfo.email}" style="color: #2563eb;">${billingInfo.email}</a>` : 'Not provided'}</div>
                 </div>
                 <div class="field">
                     <div class="field-label">Company</div>
                     <div class="field-value">${billingInfo.company || 'Not provided'}</div>
                 </div>
             </div>
         </div>

        ${projectNotes ? `
        <div class="section">
            <div class="section-title">📝 Additional Notes</div>
            <div class="field-value" style="white-space: pre-wrap;">${projectNotes}</div>
        </div>` : ''}

        <div class="footer">
            <p>Submitted via LC Mastering Request Form<br>
            ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;

      // Prepare EmailJS template parameters - simplified format
      const templateParams = {
        to_email: 'lachlanjc@gmail.com',
        from_name: artist,
        subject: `New Mastering Request - ${artist}${title ? ` - ${title}` : ''}`,
        
        // Main content fields for EmailJS template
        artist: artist,
        project_title: title || 'N/A',
        project_type: projectType.toUpperCase(),
        num_tracks: numTracks,
        contacts_info: contacts.filter(c => c.name || c.email).map(c => 
          `${c.name || 'No Name'} - ${c.email || 'No Email'} - ${c.phone || 'No Phone'} - ${c.role || 'No Role'}${c.billTo ? ' (Bill To)' : ''}`
        ).join('\n'),
        billing_info: billingInfo.name || billingInfo.email || billingInfo.company ? `${billingInfo.name || 'No Name'} - ${billingInfo.email || 'No Email'} - ${billingInfo.company || 'No Company'}` : 'No billing information provided',
        deadline: deadline ? new Date(deadline).toLocaleDateString() : 'Not specified',
        is_rush: isRush ? 'YES - Rush' : 'Standard Priority',
        master_formats: masterFormats.join(', '),
        tracks_list: tracks.map((track, i) => `${i + 1}. ${track.title}${hasISRCs && track.isrc ? ` (ISRC: ${track.isrc})` : ''}`).join('\n'),
        file_links: mixFiles.filter(f => f.url).map((f, i) => `${i + 1}. ${f.url}${f.description ? ` - ${f.description}` : ''}`).join('\n'),
        notes: projectNotes || 'None',
        has_isrc: hasISRCs ? 'Yes - Client has ISRC codes to embed' : 'No',
        submission_date: new Date().toLocaleString()
      };

      // Send email via EmailJS
      console.log("EmailJS Credentials:", {
        serviceId: 'service_oi7xq61',
        templateId: 'template_fo3ohen', 
        publicKey: 'uImkSaSkdRPL1Sk0v'
      });
      
      await emailjs.send(
        'service_oi7xq61', // Your EmailJS service ID
        'template_fo3ohen', // Your EmailJS template ID
        templateParams,
        'uImkSaSkdRPL1Sk0v' // Your correct EmailJS public key
      );

        toast({
          title: "Emailed to LC",
        });

      // Log for backup
      console.log("=== MASTERING REQUEST SENT ===");
      console.log("HTML Content:", htmlContent);
      console.log("Template Params:", templateParams);
      console.log("==============================");

      // Reset form
      setProjectType("");
      setArtist("");
      setTitle("");
      setNumTracks(1);
      setTracks([]);
      setMixFiles([{ id: "mix-1", url: "", description: "" }]);
      setHasISRCs(false);
      setDeadline("");
      setIsRush(false);
      setContacts([{ id: "contact-1", name: "", email: "", phone: "", role: "", billTo: false }]);
      setBillingInfo({ name: "", email: "", company: "" });
      setMasterFormats([]);
      setProjectNotes("");
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
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-3 tracking-wide">
            LC - Mastering Request
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Details */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h2 className="text-xl font-normal text-black mb-4">
              Project Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
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

                <div className="space-y-1">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="artist" className="text-sm font-medium text-black">Artist *</Label>
                  <Input
                    id="artist"
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Artist name"
                    className={`bg-white border-gray-300 rounded-sm ${errors.artist ? 'border-red-500' : ''}`}
                  />
                  {errors.artist && <p className="text-sm text-red-600">{errors.artist}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="title" className="text-sm font-medium text-black">
                    {projectType === "ep" ? "EP Title" : 
                     projectType === "album" ? "Album Title" : 
                     "Project Title"} {projectType !== "single" ? "*" : ""}
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      projectType === "ep" ? "EP title" : 
                      projectType === "album" ? "Album title" : 
                      "Not required for singles"
                    }
                    disabled={projectType === "single"}
                    className={`bg-white border-gray-300 rounded-sm ${
                      projectType === "single" 
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                        : errors.title ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
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
                    <Label className="text-sm font-medium text-black">Track List / Order *</Label>
                    {errors.tracks && <p className="text-sm text-red-600">{errors.tracks}</p>}
                  </div>
                  <div className="space-y-3">
                    {tracks.map((track, index) => (
                      <div key={track.id} className="p-3 bg-gray-50 border border-gray-200 rounded-sm">
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
                                 placeholder="USAB-12-34567 (dashes auto-removed)"
                                 maxLength={15}
                                 className="bg-white border-gray-300 rounded-sm font-mono"
                               />
                               <p className="text-xs text-gray-500 mt-1">
                                 Enter 12 characters with or without dashes (e.g., USAB-12-34567). Final code will be 12 characters.
                               </p>
                            </div>
                          )}
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
                    min={new Date(Date.now() + (projectType === "album" ? 10 : 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="bg-white border-gray-300 rounded-sm"
                  />
                  <p className="text-xs text-gray-600">
                    Minimum delivery time is {projectType === "album" ? "10" : "5"} business days
                  </p>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-sm border border-gray-200">
                  <Checkbox
                    id="rush"
                    checked={isRush}
                    onCheckedChange={(checked) => setIsRush(checked === true)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="rush" className="text-sm font-medium text-black">
                      Rush
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
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h2 className="text-xl font-normal text-black mb-4 flex items-center gap-3">
              <User className="h-5 w-5 text-black" />
              Contact Information
            </h2>
            
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <colgroup>
                    <col className="w-[25%]" />
                    <col className="w-[30%]" />
                    <col className="w-[18%]" />
                    <col className="w-[12%]" />
                    <col className="w-[8%]" />
                    <col className="w-[7%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-sm font-medium text-black">Name *</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-black">Email *</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-black">Phone</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-black">Role</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-black">Bill To</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact, index) => (
                      <tr key={contact.id} className="border-b border-gray-100">
                        <td className="py-2 px-2">
                          <Input
                            value={contact.name}
                            onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                            placeholder="Full name"
                            className="bg-white border-gray-300 rounded-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="email"
                            value={contact.email}
                            onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                            placeholder="email@example.com"
                            className="bg-white border-gray-300 rounded-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="tel"
                            value={contact.phone}
                            onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                            placeholder="Phone number"
                            className="bg-white border-gray-300 rounded-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Select
                            value={contact.role}
                            onValueChange={(value) => updateContact(contact.id, 'role', value)}
                          >
                            <SelectTrigger className="bg-white border-gray-300 rounded-sm">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="artist">Artist</SelectItem>
                              <SelectItem value="mixer">Mixer</SelectItem>
                              <SelectItem value="producer">Producer</SelectItem>
                              <SelectItem value="label">Label</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <Checkbox
                            checked={contact.billTo}
                            onCheckedChange={(checked) => updateContact(contact.id, 'billTo', checked === true)}
                          />
                        </td>
                        <td className="py-2 px-2">
                          {contacts.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeContact(contact.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {errors.contacts && (
                <p className="text-sm text-red-600 mt-2">
                  <AlertCircle className="inline-block w-4 h-4 mr-1" />
                  {errors.contacts}
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={addContact}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </div>
          </div>

          {/* Billing Information */}
          <div className="bg-white border border-gray-200 rounded-sm p-8">
            <h2 className="text-xl font-normal text-black mb-6 flex items-center gap-3">
              <Mail className="h-5 w-5 text-black" />
              Billing Information
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="billing-name" className="text-sm font-medium text-black">Name *</Label>
                  <Input
                    id="billing-name"
                    type="text"
                    value={billingInfo.name}
                    onChange={(e) => updateBillingInfo('name', e.target.value)}
                    placeholder="Billing name"
                    className={`bg-white border-gray-300 rounded-sm ${errors.billingName ? 'border-red-500' : ''}`}
                  />
                  {errors.billingName && <p className="text-sm text-red-600">{errors.billingName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billing-email" className="text-sm font-medium text-black">Email *</Label>
                  <Input
                    id="billing-email"
                    type="email"
                    value={billingInfo.email}
                    onChange={(e) => updateBillingInfo('email', e.target.value)}
                    placeholder="billing@email.com"
                    className={`bg-white border-gray-300 rounded-sm ${errors.billingEmail ? 'border-red-500' : ''}`}
                  />
                  {errors.billingEmail && <p className="text-sm text-red-600">{errors.billingEmail}</p>}
                </div>
               </div>

               <div className="space-y-2">
                 <Label htmlFor="billing-company" className="text-sm font-medium text-black">Company</Label>
                 <Input
                   id="billing-company"
                   type="text"
                   value={billingInfo.company}
                   onChange={(e) => updateBillingInfo('company', e.target.value)}
                   placeholder="Company name (optional)"
                   className="bg-white border-gray-300 rounded-sm"
                 />
               </div>
               
               <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-sm">
                 <strong>Tip:</strong> Check "Bill To" next to a contact above to auto-fill billing information, or enter manually.
               </div>
            </div>
          </div>

          {/* Honeypot fields - hidden from users but visible to bots */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
            <label htmlFor="website">Website *</label>
            <input
              type="text"
              id="website"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
            <label htmlFor="company">Company Name *</label>
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
