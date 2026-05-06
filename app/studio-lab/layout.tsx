import Link from "next/link";
import HideLegacySupportButton from "./HideLegacySupportButton";
import MiaStudioChat from "./MiaStudioChat";

export default function StudioLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Link href="/sair" className="studio-logout-button">
        <span className="studio-logout-dot" />
        Sair da conta
      </Link>

      {children}

      <HideLegacySupportButton />
      <MiaStudioChat />

      <style>{`
        .studio-logout-button {
          position: fixed;
          top: 18px;
          right: 18px;
          z-index: 99999;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 11px 16px;
          border-radius: 999px;
          border: 1px solid rgba(248, 113, 113, 0.55);
          color: #fff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: -0.01em;
          background:
            linear-gradient(135deg, rgba(127, 29, 29, 0.92), rgba(88, 28, 135, 0.86)),
            rgba(15, 23, 42, 0.88);
          box-shadow:
            0 18px 45px rgba(127, 29, 29, 0.28),
            0 0 22px rgba(248, 113, 113, 0.18);
          backdrop-filter: blur(14px);
          transition: transform .18s ease, filter .18s ease, box-shadow .18s ease;
        }

        .studio-logout-button:hover {
          transform: translateY(-2px) scale(1.02);
          filter: brightness(1.12);
          box-shadow:
            0 22px 55px rgba(127, 29, 29, 0.38),
            0 0 30px rgba(248, 113, 113, 0.28);
        }

        .studio-logout-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #fb7185;
          box-shadow: 0 0 14px rgba(251, 113, 133, 0.9);
        }

        @media (max-width: 720px) {
          .studio-logout-button {
            top: 12px;
            right: 12px;
            padding: 10px 13px;
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
}
