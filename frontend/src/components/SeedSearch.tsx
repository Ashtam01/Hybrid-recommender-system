import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "framer-motion";

export function SeedSearch({ onSelect }: { onSelect: (query: string) => void }) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Mock autocomplete logic
  useEffect(() => {
    if (query.length < 2) return;
    setIsSearching(true);
    const timeout = setTimeout(() => setIsSearching(false), 400);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSelect(query.trim());
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
      <form onSubmit={handleSubmit} className="relative flex items-center glass-panel rounded-xl overflow-hidden p-1">
        <div className="pl-4 pr-2 text-muted-foreground">
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </div>
        <Input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a seed track or artist..."
          className="border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-muted-foreground/60 h-14"
        />
        <AnimatePresence>
          {query.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              type="submit"
              className="px-6 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-colors mr-1"
            >
              Analyze
            </motion.button>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
