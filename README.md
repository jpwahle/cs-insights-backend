# NLP-Land-backend

<p style="text-align:center">
<a href="https://codecov.io/gh/gipplab/NLP-Land-backend"><img alt="codecov" src="https://codecov.io/gh/gipplab/NLP-Land-backend/branch/main/graph/badge.svg?token=FW8MXQX5XK"/></a>
<a href="https://github.com/gipplab/NLP-Land-backend/actions/workflows/branch.yaml"><img alt="Actions Status" src="https://github.com/gipplab/NLP-Land-backend/actions/workflows/branch.yaml/badge.svg"></a>
<a href="https://github.com/gipplab/NLP-Land-backend/actions/workflows/release.yaml"><img alt="Actions Status" src="https://github.com/gipplab/NLP-Land-backend/actions/workflows/release.yaml/badge.svg?branch=dev"></a>  
<a href="https://github.com/gipplab/NLP-Land-backend/actions/workflows/main.yaml"><img alt="Actions Status" src="https://github.com/gipplab/NLP-Land-backend/actions/workflows/main.yaml/badge.svg"></a>
<a href="https://github.com/gipplab/NLP-Land-backend/releases"><img alt="GitHub Release" src="https://img.shields.io/github/v/release/gipplab/NLP-Land-backend?sort=semver"></a>
<a href="https://hub.docker.com/repository/docker/jpelhaw/nlp-land-backend"><img alt="Docker Release" src="https://img.shields.io/docker/v/jpelhaw/nlp-land-backend?label=Docker"></a>
<a href="https://gipplab.github.io/NLP-Land-backend/"><img alt="Docs" src="https://img.shields.io/badge/Docs-gh--pages-blue"></a>
<a href="https://github.com/gipplab/NLP-Land-backend/blob/master/LICENSE"><img alt="License: MIT" src="https://black.readthedocs.io/en/stable/_static/license.svg"></a>
<a href="https://github.com/airbnb/javascript"><img alt="Code style: Airbnb" src="https://img.shields.io/badge/codestyle-Airbnb-success"></a>
</p>

## Getting Started
First, make sure you are running node v18.5.0 or higher, or you will not be able to query our [predictions endpoints](https://github.com/gipplab/NLP-Land-prediction-endpoint).
Next, clone the repository and change the directory. 
```shell
cd NLP-Land-backend
```
Then we are providing two ways to set up this project.

<details> <summary><b>Production</b></summary>

First, you need to create an `.env.production` file.
You can copy the `.env.development` file, if you do not intent to change the default values:
```shell
cp .env.development .env.production
```

In production mode an instance of mongo is created in Docker and the backend started and connected to it.
To spin up the production version of this project, switch into the root directory of this project and run:
```shell
docker-compose --env-file=.env.production up --build
```
</details>
<details> <summary><b>Development</b></summary>

If you want to actively develop this project, you need to install the project and its dependencies locally with
```shell
npm install
```

To run the development environment locally, you need to create up a mongodb instance the first time you start the backend.
```shell
source .env.development
set -o allexport
docker run -d -p 27017:27017 --name mongodev \
    -e MONGO_INITDB_ROOT_USERNAME=$MONGO_USER \
    -e MONGO_INITDB_ROOT_PASSWORD=$MONGO_PASSWORD \
    -e MONGO_INITDB_DATABASE=$MONGO_DB \
    mongo
```

Then you can start the backend using:
```shell
npm run dev
```
In the future only need to use this command and can skip the other commands.
It starts the docker container (if it is not started yet), uses auto-reload (whenever the code was changed), automatically compiles TypeScript files, and spawns multiple processes.
</details>


## Repository
### Structure
In the `src` folder we have the following structure:
- /app:
    - /controllers:
      - /frontend: Controllers that are queried by the frontend
    - /middleware:
    - /models:
- /config:
- Other files

### Packages
The following is a list of some notable packages we use:
- [Express Restify Mongoose](https://florianholzapfel.github.io/express-restify-mongoose/): Create REST interface for mongoose models


## Tests
This repository follows clean code principles using static typing, linting, unit tests, semantic releases, and documentation. In the following you can find details for running these tests in the cloud and locally.

<details> <summary> Continuous Integration (CI) </summary>

1. Whenever an issue is assigned, an issue branch from the current `dev` branch is created.
2. Whenever you create a pull request against the `dev` branch, typing, linting, and unit tests are checked.
3. Whenever a maintainer or admin creates a pull request from the `dev` to the `main` branch, a new release, docker image, documentation, and coverage report is generated.

</details>

<details> <summary> Local Pipelines </summary>

To run these CI pipelines such as tests and linting locally install [act](https://github.com/nektos/act). With act you can run CI tests in docker containers the way they are run on GitHub actions.

To run the full check suite with act you need the full ubuntu image (>12GB) and then execute:

```shell
act
```

To run a single check like the Test from the pipeline, execute:

```shell
act -j Test
```

You can also run the tests without act using:

```shell
npm run test
npm run lint
```
</details>


## Documentation
The auto-generated redoc documentation can be found [here](https://gipplab.github.io/NLP-Land-backend).
    
A general overview of standard endpoints, parameters, and possible queries can be found [here](https://florianholzapfel.github.io/express-restify-mongoose/v1/).

    
## Contribution
New Git and GitHub deploys, releases, as well as changelogs are automatically created and deployed when a maintainer or admin merges a pull request from the `dev` into the `main` branch.
    
Developers should proceed in the following way:
1. If you want to develop a new feature, fix, or test, create an issue and assign yourself to that issue. You can create a new branch using [GitHub's built-in system](https://docs.github.com/en/issues/tracking-your-work-with-issues/creating-a-branch-for-an-issue).
2. When you are done developing, create a commit with a message that includes "#patch", "#minor", or "#major" according to the semantic versioning [specification](https://semver.org/).
3. Finally, create a pull request to the `dev` branch. Assign the pull request one of the labels "fix", "feature", or "test" so they appear correctly later in the changelogs.

## License
This project is licensed under the terms of MIT license. For more information, please see the [LICENSE](LICENSE) file.

## Citation
If you use this repository, or use our tool for analysis, please cite our work:
```
@inproceedings{Wahle2022c,
  title        = {D3: A Massive Dataset of Scholarly Metadata for Analyzing the State of Computer Science Research},
  author       = {Wahle, Jan Philip and Ruas, Terry and Mohammad, Saif M. and Gipp, Bela},
  year         = {2022},
  month        = {July},
  booktitle    = {Proceedings of The 13th Language Resources and Evaluation Conference},
  publisher    = {European Language Resources Association},
  address      = {Marseille, France},
  doi          = {},
}
```