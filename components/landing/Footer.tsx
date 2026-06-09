import { Beaker } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-white/40 py-10">
      <div className="container flex flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/20">
            <Beaker className="h-3.5 w-3.5" />
          </span>
          <span className="font-display font-bold">Praxis</span>
          <span className="ml-2 text-xs text-muted-foreground">Clear next steps — for the body you have now.</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Contact</a>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Praxis</p>
      </div>
    </footer>
  );
};

export default Footer;