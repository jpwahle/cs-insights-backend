# NLP-Land-backend

<p style="text-align:center">
<a href="https://codecov.io/gh/ag-gipp/NLP-Land-backend"><img alt="codecov" src="https://codecov.io/gh/ag-gipp/NLP-Land-backend/branch/main/graph/badge.svg?token=FW8MXQX5XK"/></a>
<a href="https://github.com/ag-gipp/NLP-Land-backend/actions/workflows/branch.yaml"><img alt="Actions Status" src="https://github.com/ag-gipp/NLP-Land-backend/actions/workflows/branch.yaml/badge.svg"></a>
<a href="https://github.com/ag-gipp/NLP-Land-backend/actions/workflows/release.yaml"><img alt="Actions Status" src="https://github.com/ag-gipp/NLP-Land-backend/actions/workflows/release.yaml/badge.svg?branch=dev"></a>  
<a href="https://github.com/ag-gipp/NLP-Land-backend/actions/workflows/main.yaml"><img alt="Actions Status" src="https://github.com/ag-gipp/NLP-Land-backend/actions/workflows/main.yaml/badge.svg"></a>
<a href="https://github.com/ag-gipp/NLP-Land-backend/releases"><img alt="GitHub Release" src="https://img.shields.io/github/v/release/ag-gipp/NLP-Land-backend?sort=semver"></a>
<a href="https://hub.docker.com/repository/docker/jpelhaw/nlp-land-backend"><img alt="Docker Release" src="https://img.shields.io/docker/v/jpelhaw/nlp-land-backend?label=Docker"></a>
<a href="https://ag-gipp.github.io/NLP-Land-backend/"><img alt="Docs" src="https://img.shields.io/badge/Docs-gh--pages-blue"></a>
<a href="https://github.com/ag-gipp/NLP-Land-backend/blob/master/LICENSE"><img alt="License: MIT" src="https://black.readthedocs.io/en/stable/_static/license.svg"></a>
<a href="https://github.com/airbnb/javascript"><img alt="Code style: Airbnb" src="https://img.shields.io/badge/codestyle-Airbnb-success"></a>
</p>

## Getting Started

First, you need to copy the sample `.env.sample` file to `.env`

```
cd NLP-Land-backend
cp .env.sample .env
```

Then we are providing two ways to setup this project.

    
<details> <summary> Production </summary>
<br/>
In production mode an instance of mongo is created in Docker and the backend started and connected to it.

To spin up the production version of this project, switch into the root directory of this project and run:

```console
docker-compose up --build
```
</details>
<details> <summary> Development </summary>
<br/>
If you want to actively develop this project, you need to install the project and dependencies locally.
    
To run the development environment locally, you need to create up a mongodb instance the first time you start the backend.

```console
source .env
set -o allexport
docker run -d -p 27017:27017 --name mongodev \
    -e MONGO_INITDB_ROOT_USERNAME=$MONGO_USER \
    -e MONGO_INITDB_ROOT_PASSWORD=$MONGO_PASSWORD \
    -e MONGO_INITDB_DATABASE=$MONGO_DB \
    mongo
```
For future uses the following command will suffice.
```console
docker start mongodev
```

Then you can start the backend with auto-reload (whenever the code was changed) using.
```console
npm run build:live
```

Alternatively, just run the following.
It starts the docker container, uses auto-reload, compiles TypeScript files, and spawns multiple processes.
```console
npm run dev
```
</details>

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

```console
act
```

To run a single check like the Test from the pipeline, execute:

```console
act -j Test
```

You can also run the tests without act using:

```console
npm run test
npm run lint
```
</details>

## Documentation
The auto-generated redoc documentation can be found [here](https://ag-gipp.github.io/NLP-Land-backend).
    
A general overview of standard endpoints, parameters, and possible queries can be found [here](https://florianholzapfel.github.io/express-restify-mongoose/v1/).

    
## Contribution

New Git and GitHub deploys, releases, as well as changelogs are automatically created and deployed when a maintainer or admin merges a pull request from the `dev` into the `main` branch.
    
Developers should proceed in the following way:
1. If you want to develop a new feature, fix, or test, create an issue and assign yourself to that issue. This will trigger a GitHub action that creates a new issue from the dev branch.
2. When you are done developing, create a commit with a message that includes "#patch", "#minor", or "#major" according to the semantic versioning [specification](https://semver.org/).
3. Finally, create a pull request to the `dev` branch. Assign the pull request one of the labels "fix", "feature", or "test" so they appear correctly later in the changelogs.

## License

This project is licensed under the terms of MIT license. For more information, please see the [LICENSE](LICENSE) file.

## Citation

If you use this repository, or use our tool for analysis, please cite our work:

TODO: Add citation here and a CITATION.bib file when paper is out.
