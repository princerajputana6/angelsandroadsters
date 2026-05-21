export default function AboutPage() {
  return (
    <div className="container-x pt-28 sm:pt-32 pb-16">
      <p className="eyebrow mb-2">ABOUT US</p>
      <h1 className="section-title">BUILT FOR THE <br /><span className="gradient-text">WILD AT HEART.</span></h1>
      <p className="text-charcoal-200 max-w-3xl mt-5 text-lg">
        Angels & Roadsters is a riding and travel collective for those who measure life in miles.
        We curate gear that survives the road and host events that turn weekends into stories.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        {[
          { t: 'Premium Gear', d: 'Curated brands. Real-rider tested. No corners cut.' },
          { t: 'Real Events', d: 'Rallies, treks, expos — small groups, big experiences.' },
          { t: 'Community First', d: 'We ride with you, not at you. Stories over sales.' },
        ].map((b) => (
          <div key={b.t} className="card p-6">
            <h3 className="font-display text-2xl text-terra-400">{b.t}</h3>
            <p className="text-charcoal-300 mt-2">{b.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
