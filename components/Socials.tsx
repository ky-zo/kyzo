import { v4 as uuidv4 } from 'uuid'
import { RxGithubLogo } from 'react-icons/rx'
import { RiLinkedinFill } from 'react-icons/ri'

const socials = [
  {
    id: uuidv4(),
    name: 'twitter',
    link: 'https://twitter.com/ky__zo',
    icon: '𝕏',
  },
  {
    id: uuidv4(),
    name: 'linkedin',
    link: 'https://www.linkedin.com/in/kyzo/',
    icon: <RiLinkedinFill />,
  },
  {
    id: uuidv4(),
    name: 'github',
    link: 'https://github.com/ky-zo/',
    icon: <RxGithubLogo />,
  },
]

const Socials = () => {
  return (
    <div className="flex gap-4 text-lg">
      {socials.map((social) => {
        return (
          <a
            key={social.id}
            href={social.link}
            className=" flex h-5 w-5 items-center justify-center rounded-md bg-white hover:invert">
            {social.icon}
          </a>
        )
      })}
    </div>
  )
}

export default Socials
