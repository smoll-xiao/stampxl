![image](https://github.com/ShaneMaglangit/stampxl/assets/53674742/a4cf77c7-f195-4ce5-92b2-498a6a97b34b)

<h3 align="center">👑 Stampxl</h3>

<p align="center">
 Built your empire of pixel badges. Show off your collection that reflects your personality and achievements. Participate in events or trade with others to grow your inventory (inspired by <a href="https://stampxl.shanemaglangit.com">Holopin.io</a>)
 <br />
 <a href="https://stampxl.shanemaglangit.com"><strong>Visit the site »</strong></a>
 <br />
 <br />
 <a href="https://stampxl.shanemaglangit.com">Website</a>
 ·
 <a href="https://github.com/ShaneMaglangit/stampxl/issues">Issues</a>
 ·
 <a href="https://hanko.io">Hanko</a>
</p>

## About the project

Stampxl is an open-sourced project inspired by Holopin.io where you can collect and trade pixel badge collectibles.
These are distributed through events or as easter-eggs. Some badges are tradeable, which means you can trade with other
users to grow your collection and own badges that you have missed out on.

### Features

- **Create Badges** Organizations, maintainers, and recognized individuals can create badges that they can distribute as
  rewards or as giveaways.
- **Collect Badges** Users can collect badges by reedeming them through claim tokens/links that are distributed by the
  creators.
- **Trade Badges** Users can trade badges with other users, to grow their own collection or get rarer badges to that suits
  their personality.
- **Passwordless Authentication** Experience a seamless login experience with passwordless authentication with passkeys.

Are you now curious with our platform? [Join us now](https://stampxl.shanemaglangit.com/), we're giving away free
early-bird badges for the first 100 users!

## Contributing

### Prerequisites

Here is what you need to be able to run Stampxl.

- Node.js (Version: >=20.x)
- PostgreSQL
- [Hanko Cloud](https://cloud.hanko.io/)
- PNPM _(recommended)_

### Setup

1. Clone the repo into a public GitHub repository (or fork https://github.com/ShaneMaglangit/stampxl/fork).

   ```sh
   git clone git@github.com:ShaneMaglangit/stampxl.git
   ```

2. Install dependencies

    ```sh
    cd stampxl
    pnpm install
    ```

3. Setup environment variables by copying `.env.example` to `.env` and filling in the values.

    ```sh
    mv .env.example .env
    ```
   
4. Initialize the database (make sure `DATABASE_URL` contains a valid database connection string)

    ```sh
    pnpm db:push
    ```
   
5. Run the development server

    ```sh
    pnpm dev
    ```
   
### Update User Roles

1. Create a new account by going to `/login` and completing the registration process.
2. Go to the `users` table in the database and add `CREATOR` and `ADMIN` to your roles.
   3. `CREATOR` - allows you to create badges
   4. We would add a script to automate this in the future. If you're interested in contributing, feel free to open a Pull Request

### Best Practices and Guidelines

- [Writing good commit messages](https://cbea.ms/git-commit/)
- We are yet to add determine conventions and style guidelines for the project. But we're open to suggestions and contributions.

### Start Contributing!

You're all set! Visit our [issues](https://github.com/ShaneMaglangit/stampxl/issues) to start contributing.

## License

Distributed under the [GNU General Public License v3.0](https://github.com/ShaneMaglangit/stampxl/blob/main/LICENSE.md). See `LICENSE.md` for more information.

## Acknowledgements

Special thanks to these amazing projects which help power Stampxl:

- [Hanko](https://hanko.io/)
- [Vercel](https://vercel.com/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TRPC](https://trpc.io/)
- [Prisma](https://prisma.io/)
