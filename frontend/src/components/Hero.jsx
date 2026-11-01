// Bannière sombre avec image de fond optionnelle (public/images/<image>.jpg)
export default function Hero({ badge, title, text, image, tall, children }) {
  return (
    <section className={'hero' + (tall ? ' hero-tall' : '')} style={{ '--hero-img': `url(/images/${image})` }}>
      <div className="hero-inner">
        <span className="badge-cyan">{badge}</span>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
        {children && <div className="hero-actions">{children}</div>}
      </div>
    </section>
  );
}
