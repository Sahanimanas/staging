module.exports = {

  apps: [

    {

      name: "backend",

      script: "server.js",


      // Load secrets from your secure env file

      env_file: "/etc/secrets/stripe.env",


      // Add fallback/default environment variables

      env: {

        NODE_ENV: "production",

        PORT: 3000   // always ensure PORT is defined

      }

    }

  ]

};

