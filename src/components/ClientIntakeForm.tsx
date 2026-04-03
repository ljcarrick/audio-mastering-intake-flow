import { useState, useEffect, useRef, memo } from "react";

// Isolated textarea so fast typing doesn't re-render the whole form
const NotesTextarea = memo(function NotesTextarea({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  return (
    <Textarea
      id="notes"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onChange(local)}
      rows={4}
      className="bg-white border-gray-300 rounded-sm"
    />
  );
});
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Music, User, Mail, Phone, Upload, AlertCircle, Plus, X, ExternalLink, Cloud, Check, ChevronDown } from "lucide-react";
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
  const [extraPasses, setExtraPasses] = useState<string[]>([]);
  const [honeypot, setHoneypot] = useState("");
  const [honeypot2, setHoneypot2] = useState("");
  const [honeypot3, setHoneypot3] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const lastSubmissionRef = useRef<number>(0);

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
      // Remove all dashes and non-alphanumeric characters, keep only letters and numbers
      const cleanValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      // Limit to exactly 12 characters
      const limitedValue = cleanValue.slice(0, 12);
      updatedTracks[index] = { ...updatedTracks[index], [field]: limitedValue };
    } else {
      updatedTracks[index] = { ...updatedTracks[index], [field]: value };
    }
    
    setTracks(updatedTracks);
  };

  // Format ISRC for display with dashes (XX-XXX-XX-XXXXX)
  const formatISRCDisplay = (isrc: string) => {
    if (!isrc) return "";
    const clean = isrc.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (clean.length >= 2) {
      let formatted = clean.slice(0, 2);
      if (clean.length > 2) formatted += '-' + clean.slice(2, 5);
      if (clean.length > 5) formatted += '-' + clean.slice(5, 7);
      if (clean.length > 7) formatted += '-' + clean.slice(7, 12);
      return formatted;
    }
    return clean;
  };

  // Handle paste across ISRC chunks
  const handleISRCPaste = (index: number, pastedText: string) => {
    const cleanValue = pastedText.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
    updateTrack(index, 'isrc', cleanValue);
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
      description: ""
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

  const toggleExtraPass = (pass: string) => {
    setExtraPasses(prev => 
      prev.includes(pass) 
        ? prev.filter(f => f !== pass)
        : [...prev, pass]
    );
  };

  const handleAutofillISRC = () => {
    if (tracks.length <= 1 || !tracks[0].isrc) return;
    
    const firstISRC = tracks[0].isrc;
    if (firstISRC.length < 12) return;
    
    const baseISRC = firstISRC.slice(0, 7); // First 7 characters (XX-XXX-XX)
    const startNumber = parseInt(firstISRC.slice(7)); // Last 5 digits
    
    const updatedTracks = tracks.map((track, index) => {
      if (index === 0) return track; // Keep first track unchanged
      
      const newNumber = (startNumber + index).toString().padStart(5, '0');
      const newISRC = baseISRC + newNumber;
      
      return { ...track, isrc: newISRC };
    });
    
    setTracks(updatedTracks);
  };

  const shouldShowAutofill = () => {
    return hasISRCs && tracks.length > 1 && tracks[0].isrc && tracks[0].isrc.length === 12;
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
        setMixFiles(files => files.map(file =>
          file.id === fileId ? { ...file, title: "Dropbox", isLoading: false } : file
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

    } catch {
      // title fetch is best-effort — silently ignore
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


    // Check if honeypot fields are filled (indicates bot)
    if (honeypot || honeypot2 || honeypot3) {
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
      !honeypot &&
      !honeypot2 &&
      !honeypot3
    );
  };

  const escapeHtml = (str: string): string =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

  const resetForm = () => {
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
    setExtraPasses([]);
    setProjectNotes("");
    setHoneypot("");
    setHoneypot2("");
    setHoneypot3("");
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Silent fail for bots
    if (honeypot || honeypot2 || honeypot3) return;

    // Rate limiting: 60s between submissions
    const now = Date.now();
    if (now - lastSubmissionRef.current < 60_000) {
      toast({
        title: "Please wait",
        description: "You can only submit once per minute.",
        variant: "destructive",
      });
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
      // 1. Persist to Supabase first — if this fails, nothing is sent
      const { data: insertData, error: dbError } = await supabase
        .from('intake_submissions')
        .insert({
          user_id: user!.id,
          artist,
          project_title: title || null,
          project_type: projectType,
          num_tracks: numTracks,
          tracks: tracks as unknown as never,
          mix_files: mixFiles.map(f => ({ url: f.url, description: f.description })) as unknown as never,
          has_isrcs: hasISRCs,
          deadline: deadline || null,
          is_rush: isRush,
          contacts: contacts as unknown as never,
          billing_info: billingInfo as unknown as never,
          master_formats: masterFormats,
          extra_passes: extraPasses,
          project_notes: projectNotes || null,
          email_sent: false,
        })
        .select('id')
        .single();

      if (dbError) throw new Error(`Database error: ${dbError.message}`);

      // 2. Build HTML email with escaped user content
      const e = escapeHtml;
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
        .section-title { font-size: 18px; font-weight: 500; color: #111827; margin-bottom: 15px; }
        .field-group { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
        .field-label { font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .field-value { font-size: 14px; color: #111827; }
        .track-list { margin-top: 10px; }
        .track-item { background: #f9fafb; padding: 12px; margin-bottom: 8px; border-radius: 6px; border-left: 3px solid #111827; }
        .track-number { font-weight: 600; color: #111827; }
        .formats-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .format-tag { background: #111827; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
        .file-link { color: #2563eb; text-decoration: none; word-break: break-all; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        @media (max-width: 600px) { .field-group { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LC - Mastering Request</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.8;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div class="section">
            <div class="section-title">🎵 Project Details</div>
            <div class="field-group">
                <div class="field"><div class="field-label">Artist</div><div class="field-value">${e(artist)}</div></div>
                ${title ? `<div class="field"><div class="field-label">${projectType === "ep" ? "EP" : projectType === "album" ? "Album" : "Project"} Title</div><div class="field-value">${e(title)}</div></div>` : ''}
            </div>
            <div class="field-group">
                <div class="field"><div class="field-label">Project Type</div><div class="field-value">${e(projectType.toUpperCase())}</div></div>
                <div class="field"><div class="field-label">Number of Tracks</div><div class="field-value">${numTracks}</div></div>
            </div>
            ${deadline ? `<div class="field-group">
                <div class="field"><div class="field-label">Preferred Deadline</div><div class="field-value">${new Date(deadline).toLocaleDateString()}</div></div>
                <div class="field"><div class="field-label">Priority</div><div class="field-value">${isRush ? '<span style="background:#dc2626;color:white;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:bold;">RUSH ORDER</span>' : 'Standard Priority'}</div></div>
            </div>` : isRush ? `<div class="field"><div class="field-label">Priority</div><div class="field-value"><span style="background:#dc2626;color:white;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:bold;">RUSH ORDER</span></div></div>` : ''}
        </div>
        <div class="section">
            <div class="section-title">🎼 Track List / Order</div>
            <div class="track-list">
                ${tracks.map((track, i) => `<div class="track-item"><span class="track-number">${i + 1}.</span> ${e(track.title)}${hasISRCs && track.isrc ? `<br><small style="color:#6b7280;">ISRC: ${e(formatISRCDisplay(track.isrc))}</small>` : ''}</div>`).join('')}
            </div>
        </div>
        <div class="section">
            <div class="section-title">📁 Project Files</div>
            ${mixFiles.filter(file => file.url).map((file, i) => `<div style="margin-bottom:12px;"><div class="field-label">File ${i + 1}</div><div class="field-value"><a href="${e(file.url)}" class="file-link" target="_blank" rel="noopener noreferrer">${e(file.url)}</a>${file.description ? `<br><small style="color:#6b7280;">${e(file.description)}</small>` : ''}</div></div>`).join('')}
        </div>
        <div class="section">
            <div class="section-title">🎚️ Required Master Formats</div>
            <div class="formats-list">${masterFormats.map(format => `<span class="format-tag">${e(format)}</span>`).join('')}</div>
            ${extraPasses.length > 0 ? `<div style="margin-top:16px;"><div style="font-size:16px;font-weight:500;color:#111827;margin-bottom:8px;">Extra Passes</div><div class="formats-list">${extraPasses.map(pass => `<span class="format-tag">${e(pass)}</span>`).join('')}</div></div>` : ''}
            ${hasISRCs ? '<p style="margin-top:12px;font-size:14px;color:#6b7280;">✓ Client has ISRC codes to embed</p>' : ''}
        </div>
        <div class="section">
            <div class="section-title">📞 Contact Information</div>
            ${contacts.filter(c => c.name || c.email).map(c => `<div style="margin-bottom:16px;padding:12px;background:#f9fafb;border-radius:6px;"><div class="field-group"><div class="field"><div class="field-label">Name</div><div class="field-value">${e(c.name) || 'Not provided'}</div></div><div class="field"><div class="field-label">Email</div><div class="field-value">${c.email ? `<a href="mailto:${e(c.email)}" style="color:#2563eb;">${e(c.email)}</a>` : 'Not provided'}</div></div></div><div class="field-group"><div class="field"><div class="field-label">Phone</div><div class="field-value">${c.phone ? `<a href="tel:${e(c.phone)}" style="color:#2563eb;">${e(c.phone)}</a>` : 'Not provided'}</div></div><div class="field"><div class="field-label">Role</div><div class="field-value">${e(c.role) || 'Not specified'}</div></div></div>${c.billTo ? '<p style="margin-top:8px;font-size:12px;color:#6b7280;font-weight:500;">📧 Billing Contact</p>' : ''}</div>`).join('')}
        </div>
        <div class="section">
            <div class="section-title">💳 Billing Information</div>
            <div class="field-group">
                <div class="field"><div class="field-label">Billing Name</div><div class="field-value">${e(billingInfo.name) || 'Not provided'}</div></div>
                <div class="field"><div class="field-label">Billing Email</div><div class="field-value">${billingInfo.email ? `<a href="mailto:${e(billingInfo.email)}" style="color:#2563eb;">${e(billingInfo.email)}</a>` : 'Not provided'}</div></div>
                <div class="field"><div class="field-label">Company</div><div class="field-value">${e(billingInfo.company) || 'Not provided'}</div></div>
            </div>
        </div>
        ${projectNotes ? `<div class="section"><div class="section-title">📝 Additional Notes</div><div class="field-value" style="white-space:pre-wrap;">${e(projectNotes)}</div></div>` : ''}
        <div class="footer"><p>Submitted via LC Mastering Request Form<br>${new Date().toLocaleString()}</p></div>
    </div>
</body>
</html>`;

      // 3. Send email via EmailJS
      const templateParams = {
        to_email: 'lachlanjc@gmail.com',
        from_name: artist,
        subject: `New Mastering Request - ${artist}${title ? ` - ${title}` : ''}`,
        artist,
        project_title: title || 'N/A',
        project_type: projectType.toUpperCase(),
        num_tracks: numTracks,
        contacts_info: contacts.filter(c => c.name || c.email).map(c =>
          `${c.name || 'No Name'} - ${c.email || 'No Email'} - ${c.phone || 'No Phone'} - ${c.role || 'No Role'}${c.billTo ? ' (Bill To)' : ''}`
        ).join('\n'),
        billing_info: billingInfo.name || billingInfo.email || billingInfo.company
          ? `${billingInfo.name || 'No Name'} - ${billingInfo.email || 'No Email'} - ${billingInfo.company || 'No Company'}`
          : 'No billing information provided',
        deadline: deadline ? new Date(deadline).toLocaleDateString() : 'Not specified',
        priority: isRush ? 'RUSH ORDER' : '',
        standard: isRush ? '' : 'Standard Priority',
        master_formats: masterFormats.join(', '),
        extra_passes: extraPasses.length > 0 ? extraPasses.join(', ') : 'None',
        tracks_list: tracks.map((track, i) => `${i + 1}. ${track.title}${hasISRCs && track.isrc ? ` (ISRC: ${track.isrc})` : ''}`).join('\n'),
        file_links: mixFiles.filter(f => f.url).map((f, i) => `${i + 1}. ${f.url}${f.description ? ` - ${f.description}` : ''}`).join('\n'),
        notes: projectNotes || 'None',
        has_isrc: hasISRCs ? 'Yes - Client has ISRC codes to embed' : 'No',
        submission_date: new Date().toLocaleString(),
      };

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        {
          publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
          privateKey: import.meta.env.VITE_EMAILJS_PRIVATE_KEY,
        }
      );

      // Mark email as sent in the database
      await supabase
        .from('intake_submissions')
        .update({ email_sent: true })
        .eq('id', insertData.id);

      lastSubmissionRef.current = Date.now();

      toast({ title: "Request submitted successfully!" });

      setIsSubmitted(true);
      resetForm();

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isDbError = message.startsWith('Database error');
      toast({
        title: isDbError ? "Submission failed" : "Saved, but email failed",
        description: isDbError
          ? "Could not save your request. Please try again."
          : "Your request was saved. Email notification may not have sent — please follow up directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewRequest = () => {
    resetForm();
    setIsSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <img 
            src="/logo.png"
            alt="LC - Mastering Request" 
            className="mx-auto mb-3 h-12"
          />
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
                   <Label htmlFor="project-type" className="text-sm font-medium text-black">Project Type <span className={`${!projectType ? 'text-red-500' : 'text-green-500'}`}>*</span></Label>
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
                   <Label htmlFor="artist" className="text-sm font-medium text-black">Artist <span className={`${!artist.trim() ? 'text-red-500' : 'text-green-500'}`}>*</span></Label>
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
                      "Project Title"} {(projectType === "ep" || projectType === "album") ? <span className={`${(projectType === "ep" || projectType === "album") && !title.trim() ? 'text-red-500' : (projectType === "ep" || projectType === "album") ? 'text-green-500' : ''}`}>*</span> : ""}
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
                      Format: XX (Country) - XXX (Registrant) - XX (Year) - XXXXX (Designation)
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
                    <Label className="text-sm font-medium text-black">Track List / Order <span className={`${tracks.some(track => !track.title.trim()) ? 'text-red-500' : 'text-green-500'}`}>*</span></Label>
                    {errors.tracks && <p className="text-sm text-red-600">{errors.tracks}</p>}
                  </div>
                  <div className="space-y-3">
                    {tracks.map((track, index) => (
                      <div key={track.id} className="p-3 bg-gray-50 border border-gray-200 rounded-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           <div className="space-y-1">
                             <Label htmlFor={`track-title-${index}`} className="text-sm font-medium text-black">
                               {index + 1}. Song Title <span className={`${!track.title.trim() ? 'text-red-500' : 'text-green-500'}`}>*</span>
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
                                 <Label htmlFor={`isrc-${index}`} className="text-sm font-medium text-black">
                                   ISRC Code
                                 </Label>
                                 <div className="flex items-center gap-2 flex-wrap">
                                   <Input
                                     id={`isrc-${index}`}
                                     value={track.isrc
                                       ? [track.isrc.slice(0,2), track.isrc.slice(2,5), track.isrc.slice(5,10)].filter(p => p).join('-')
                                       : ''}
                                     onChange={(e) => {
                                       const raw = e.target.value.replace(/-/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                                       updateTrack(index, "isrc", raw);
                                     }}
                                     onPaste={(e) => {
                                       e.preventDefault();
                                       const pastedText = e.clipboardData.getData('text');
                                       handleISRCPaste(index, pastedText);
                                     }}
                                     placeholder="XX-XXX-XXXXX"
                                     maxLength={12}
                                     className="bg-white border-gray-300 rounded-sm w-40 font-mono tracking-wider"
                                   />
                                   {shouldShowAutofill() && index === 0 && (
                                     <Button
                                       type="button"
                                       variant="outline"
                                       size="sm"
                                       onClick={handleAutofillISRC}
                                       className="text-xs px-2 py-1 h-8"
                                     >
                                       <ChevronDown className="h-3 w-3 mr-1" />
                                       Autofill
                                     </Button>
                                   )}
                                 </div>
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
                  <Label className="text-sm font-medium text-black">Dropbox/Drive Link</Label>
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
                        We'll confirm pricing and availability for expedited delivery. Please add your deadline and any timing details in the Project Notes below.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Master Formats */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-black">Required Master Formats <span className={`${masterFormats.length === 0 ? 'text-red-500' : 'text-green-500'}`}>*</span></Label>
                  {errors.masterFormats && <p className="text-sm text-red-600">{errors.masterFormats}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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

               {/* Extra Passes */}
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <Label className="text-sm font-medium text-black">Extra Passes</Label>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                   {["Instrumental Masters", "TV Masters"].map((pass) => (
                     <div key={pass} className="flex items-center space-x-2">
                       <Checkbox
                         id={pass.toLowerCase().replace(" ", "-")}
                         checked={extraPasses.includes(pass)}
                         onCheckedChange={() => toggleExtraPass(pass)}
                       />
                       <Label 
                         htmlFor={pass.toLowerCase().replace(" ", "-")}
                         className="text-sm font-medium text-black"
                       >
                         {pass}
                       </Label>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-black">Project Notes / Preferences (optional)</Label>
                <NotesTextarea value={projectNotes} onChange={setProjectNotes} />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h2 className="text-xl font-normal text-black mb-4 flex items-center gap-3">
              <User className="h-5 w-5 text-black" />
              Contact Information (Queries, Master Deliveries)
            </h2>
            
            <div className="space-y-3">
              {/* Mobile card layout */}
              <div className="md:hidden space-y-3">
                {contacts.map((contact, index) => (
                  <div key={contact.id} className="p-4 bg-gray-50 border border-gray-200 rounded-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-black">Contact {index + 1}</span>
                      {contacts.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeContact(contact.id)} className="text-red-600 hover:text-red-800 -mr-2">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Name <span className={`${!contact.name.trim() ? 'text-red-500' : 'text-green-500'}`}>*</span></Label>
                        <Input value={contact.name} onChange={(e) => updateContact(contact.id, 'name', e.target.value)} placeholder="Full name" className="bg-white border-gray-300 rounded-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Email <span className={`${!contact.email.trim() || !/\S+@\S+\.\S+/.test(contact.email) ? 'text-red-500' : 'text-green-500'}`}>*</span></Label>
                        <Input type="email" value={contact.email} onChange={(e) => updateContact(contact.id, 'email', e.target.value)} placeholder="email@example.com" className="bg-white border-gray-300 rounded-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Phone</Label>
                          <Input type="tel" value={contact.phone} onChange={(e) => updateContact(contact.id, 'phone', e.target.value)} placeholder="Phone" className="bg-white border-gray-300 rounded-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Role</Label>
                          <Select value={contact.role} onValueChange={(value) => updateContact(contact.id, 'role', value)}>
                            <SelectTrigger className="bg-white border-gray-300 rounded-sm">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="artist">Artist</SelectItem>
                              <SelectItem value="mixer">Mixer</SelectItem>
                              <SelectItem value="producer">Producer</SelectItem>
                              <SelectItem value="label">Label</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox checked={contact.billTo} onCheckedChange={(checked) => updateContact(contact.id, 'billTo', checked === true)} id={`bill-to-mobile-${contact.id}`} />
                        <Label htmlFor={`bill-to-mobile-${contact.id}`} className="text-sm text-gray-700">Bill To</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table layout */}
              <div className="hidden md:block overflow-x-auto">
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
                       <th className="text-left py-2 px-2 text-sm font-medium text-black">Name <span className={`${!contacts.some(c => c.name.trim()) ? 'text-red-500' : 'text-green-500'}`}>*</span></th>
                       <th className="text-left py-2 px-2 text-sm font-medium text-black">Email <span className={`${!contacts.some(c => c.email.trim() && /\S+@\S+\.\S+/.test(c.email)) ? 'text-red-500' : 'text-green-500'}`}>*</span></th>
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
                  <Label htmlFor="billing-name" className="text-sm font-medium text-black">Name <span className={`${!billingInfo.name.trim() ? 'text-red-500' : 'text-green-500'}`}>*</span></Label>
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
                  <Label htmlFor="billing-email" className="text-sm font-medium text-black">Email <span className={`${!billingInfo.email || !/\S+@\S+\.\S+/.test(billingInfo.email) ? 'text-red-500' : 'text-green-500'}`}>*</span></Label>
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
            <label htmlFor="middlename">Middle Name *</label>
            <input
              type="text"
              id="middlename"
              name="middlename"
              value={honeypot3}
              onChange={(e) => setHoneypot3(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-4">
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
            {isSubmitted && (
              <Button 
                type="button" 
                size="lg" 
                onClick={handleNewRequest}
                className="px-8 py-3 rounded-sm font-medium bg-white border border-gray-300 text-black hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Mastering Request
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
