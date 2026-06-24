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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto mt-8"
    >
      <form onSubmit={handleSubmit} className="relative flex items-center bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-full overflow-hidden p-1.5 shadow-sm transition-all focus-within:border-primary/50 focus-within:bg-zinc-900">
        <div className="pl-5 pr-3 text-zinc-500">
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </div>
        <Input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a seed track or artist..."
          className="border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-zinc-600 h-12 w-full"
        />
        <AnimatePresence>
          {query.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              type="submit"
              className="px-6 h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-full transition-colors mr-1"
            >
              Analyze
            </motion.button>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}
