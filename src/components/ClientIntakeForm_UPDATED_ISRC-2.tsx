
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProjectType = "single" | "ep" | "album";
type ISRCChunk = [string, string, string, string];

const ClientIntakeForm = () => {
  const [honeypot, setHoneypot] = useState("");
  const [honeypot2, setHoneypot2] = useState("");
  const [projectType, setProjectType] = useState<ProjectType | "">("");
  const [numTracks, setNumTracks] = useState(1);
  const [hasIsrc, setHasIsrc] = useState("no");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot || honeypot2) {
      console.log("Bot detected - form submission blocked");
      return;
    }

    const flatIsrcs = isrcChunks.map(chunk => chunk.join(''));
    console.log("Submitting ISRCs:", flatIsrcs);
    // Submit form data including flatIsrcs
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
          <input type="text" name="honeypot" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
          <input type="text" name="honeypot2" value={honeypot2} onChange={(e) => setHoneypot2(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h2 className="text-xl font-normal text-black mb-4">Project Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="project-type" className="text-sm font-medium text-black">Project Type *</Label>
                  <Select value={projectType} onValueChange={(value) => setProjectType(value as ProjectType)}>
                    <SelectTrigger className="bg-white border-gray-300 rounded-sm">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="ep">EP</SelectItem>
                      <SelectItem value="album">Album</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h2 className="text-xl font-normal text-black mb-4">ISRC Codes</h2>
            <RadioGroup value={hasIsrc} onValueChange={setHasIsrc} className="flex gap-6 mb-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="isrc-no" />
                <Label htmlFor="isrc-no">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="isrc-yes" />
                <Label htmlFor="isrc-yes">Yes</Label>
              </div>
            </RadioGroup>

            {hasIsrc === "yes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm text-gray-600">Enter ISRCs</h4>
                  <button
                    type="button"
                    onClick={autoFillISRCs}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Auto-fill remaining
                  </button>
                </div>

                {isrcChunks.map((chunk, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-10">#{idx + 1}</span>
                    {chunk.map((val, cIdx) => (
                      <Input
                        key={cIdx}
                        value={val}
                        onChange={(e) => handleISRCInput(idx, cIdx, e.target.value)}
                        maxLength={cIdx === 3 ? 5 : cIdx === 1 ? 3 : 2}
                        placeholder={['CC', 'REG', 'YR', '#####'][cIdx]}
                        className="w-16 text-center border-gray-300 text-sm"
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientIntakeForm;
