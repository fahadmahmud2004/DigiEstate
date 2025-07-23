import { Facebook, Youtube, Github, Twitter, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="fixed bottom-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <div className="container px-0 flex h-10 items-center justify-between mr-0 pr-0">
        <p className="ml-6 text-sm text-muted-foreground">
          Built by{" "}
          <a href="https://www.facebook.com/fahadmahmud2004" target="_blank" rel="noopener noreferrer">Fahad</a> &{" "}
          <a href="https://www.facebook.com/fahim.faiaz.adib" target="_blank" rel="noopener noreferrer">Adib</a>
        </p>
        <div className="flex items-center gap-4 ml-auto mr-1 pr-0">
          <a
            href="https://www.facebook.com/profile.php?id=61576349096463e"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
          >
            <Facebook className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          </a>
          <a
            href="https://www.youtube.com/watch?v=Nf7V5IIsBkw&t=8s"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
          >
            <Youtube className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          </a>
          <a
            href="https://github.com/fahadmahmud2004"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <Github className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          </a>
          <a
            href="https://x.com/FahadMahmud2004"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
          >
            <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          </a>
          <a
            href="https://www.linkedin.com/in/fahadmahmud2004/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          </a>
        </div>
      </div>
    </footer>
  );
}