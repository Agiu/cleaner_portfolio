import { MediaBlock } from '../components/MediaBlock'
import { ArrowLink } from '../components/Profile'
import { profile } from '../data/caseStudies'
import { about } from '../data/site'

/** About: portrait, a short bio, then experience / capabilities / tools / contact columns. */
export function About() {
  return (
    <article className="about">
      <MediaBlock src={about.portrait} className="about-portrait" />

      <div className="about-text">
        {/* The sidebar name is hidden on this page, so the lead becomes the page heading. */}
        <h1 className="about-lead">{about.lead}</h1>
        {about.body.map((p, i) => (
          <p key={i} className="about-body">
            {p}
          </p>
        ))}
      </div>

      <div className="about-columns">
        <section>
          <h2 className="about-heading">Experience</h2>
          <ul className="about-list">
            {about.experience.map((job, i) => (
              <li key={i} className="about-job">
                <span>{job.role}</span>
                <span className="about-muted">{job.org}</span>
                <span className="about-muted">{job.years}</span>
              </li>
            ))}
          </ul>
          {/* The long form: every role with what it changed, on the recruiter page. */}
          <div className="about-more">
            <ArrowLink href="/recruiter" label="See full experience" />
          </div>
        </section>
        <section>
          <h2 className="about-heading">Capabilities</h2>
          <ul className="about-list">
            {about.capabilities.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="about-heading">Tools</h2>
          <ul className="about-list">
            {about.tools.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="about-heading">Elsewhere</h2>
          <ul className="about-list">
            {profile.links.map((link) => (
              <li key={link.label}>
                <a className="about-link" href={link.href} target="_blank" rel="noreferrer">
                  {link.label} <span className="contact-arrow">→</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  )
}
