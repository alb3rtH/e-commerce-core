# e-commerce-core

### Description
>e-commerce-core is a project developed primarily in TypeScript, that provides the functional foundation for e-commerce platforms. This repository contains the essential logic and components for managing products, users, orders, and other key features required in an e-commerce system, including an implementation of Stripe for processing payments 
<img src="https://static.cdnlogo.com/logos/s/83/stripe.svg" height="200"/>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>

### Stack Icons
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" height="40" alt="typescript logo" />
 <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" height="40" alt="nodejs logo"  />
 <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nestjs/nestjs-original.svg" height="40" alt="nestjs logo"  />
<img src="https://skillicons.dev/icons?i=docker" height="40" alt="docker logo"   />
<img src="https://skillicons.dev/icons?i=postgres" height="40" alt="postgresql logo"/><img width="12" />
<img src="https://skillicons.dev/icons?i=pnpm" height="40" alt="pnpm logo"/><img width="12" />

## 🚀 Project Setup
```bash
# clone the repository
$ git clone https://github.com/alb3rtH/e-commerce-core.git
```
```bash
# change directory
$ cd e-commerce-core/
```
```bash
# install dependencies
$ pnpm install
```
```bash
# start dev project
$ pnpm run start:dev
```

## Features
- Stripe integration  
- Modules
		- user
		- auth
		- order
		- payment
		- product
 - Authentication
		- JWT: Bearer Token
 - Integration of Order + Inventory + Stripe Checkout
 - Swagger + validaciones + DB PostgreSQL via TypeORM
