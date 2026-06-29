const socialLinks = [
  {
    href: "https://www.facebook.com/profile.php?id=61591005877946",
    icon: "ti ti-brand-facebook",
    label: "Facebook",
  },
  {
    href: "https://www.tiktok.com/@audio_peak",
    icon: "ti ti-brand-tiktok",
    label: "TikTok",
  },
];

export default function SocialFloating() {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
      {socialLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-all duration-200 hover:scale-110 hover:border-white/30"
          aria-label={link.label}
        >
          <i className={`${link.icon} text-white`} style={{ fontSize: 15 }} />
        </a>
      ))}
    </div>
  );
}
