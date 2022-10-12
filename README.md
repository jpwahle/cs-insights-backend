<br/>
<div align="center">
  <a href="https://cs-insights.uni-goettingen.de">
    <img src="logo.png" alt="Logo" width="500">
  </a>
</div>
<br/>
<p align="center">
<a href="https://codecov.io/gh/jpwahle/cs-insights-backend"><img alt="Code Coverage" src="https://codecov.io/gh/jpwahle/cs-insights-backend/branch/main/graph/badge.svg?token=FW8MXQX5XK"/></a>
<a href="https://github.com/jpwahle/cs-insights-backend/actions/workflows/release.yml"><img alt="Actions Status" src="https://github.com/jpwahle/cs-insights-backend/actions/workflows/release.yml/badge.svg?branch=dev"></a>  
<a href="https://github.com/jpwahle/cs-insights-backend/actions/workflows/main.yml"><img alt="Actions Status" src="https://github.com/jpwahle/cs-insights-backend/actions/workflows/main.yml/badge.svg"></a>
<a href="https://github.com/jpwahle/cs-insights-backend/releases"><img alt="GitHub Release" src="https://img.shields.io/github/v/release/jpwahle/cs-insights-backend?sort=semver"></a>
<a href="https://jpwahle.github.io/cs-insights-backend/"><img alt="Docs" src="https://img.shields.io/badge/Docs-gh--pages-blue"></a>
<a href="https://github.com/ag-gipp/cs-insights-backend/blob/master/LICENSE"><img alt="License: MIT" src="https://black.readthedocs.io/en/stable/_static/license.svg"></a>
<a href="https://github.com/airbnb/javascript"><img alt="Code style: Airbnb" src="https://img.shields.io/badge/codestyle-Airbnb-success"></a>
<a href="https://jpwahle.github.io/cs-insights-uptime/"><img alt="All-time uptime 100.00%" src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjpwahle%2Fcs-insights-uptime%2FHEAD%2Fapi%2Fbackend%2Fuptime.json"></a>
<a href="https://jpwahle.github.io/cs-insights-uptime/"><img alt="Response time 773" src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjpwahle%2Fcs-insights-uptime%2FHEAD%2Fapi%2Fbackend%2Fresponse-time.json"></a>
</p>
<br/>

## Getting Started

This project is part of the `cs-insights`-ecosystem. Please refer to the readme [here](https://github.com/jpwahle/cs-insights) to spin up the development and production system.

## Repository
### Structure
The `src`-folder contains the main code with the following structure:
- /app: The main logic for our app
  - /controllers: Controls api endpoints and requests/responses
  - /middleware: Middleware for authentication
  - /models: Data models of the database schemas
- /config: Configuration parameters for the app
- Other files

### Packages
The following is a list of some notable packages we use:
- [ExpressRestifyMongoose](https://florianholzapfel.github.io/express-restify-mongoose/v1/): REST API endpoints
- [Express](https://expressjs.com): Endpoints
- [Mongoose](https://mongoosejs.com): Database layer on mongo
- [Passport](https://www.passportjs.org): Authentication
- [Redoc](https://github.com/Redocly/redoc): Automatic documentation
    
## Tests
This repository follows clean code principles using static typing, linting, unit tests, semantic releases, and documentation. In the following you can find details for running these tests in the cloud and locally.

<details> <summary> Continuous Integration (CI) </summary>

1. Whenever you create a pull request against the `dev` branch, typing, linting, and unit tests are checked.
2. Whenever a maintainer or admin creates a pull request from the `dev` to the `main` branch, a new release, docker image, documentation, and coverage report is generated.

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

We use an additional npm script `test2` to make it easier to run specific tests using `grep`:
```shell
npm run test2 -- -g <query>
```
This will not generate a code coverage report and by replacing `<query>` with
e.g. `topics` only tests or test groups that contain the word `topics` will be run.

</details>


## Documentation
The auto-generated redoc documentation can be found [here](https://gipplab.github.io/cs-insights-backend/).

A general overview of standard endpoints, parameters, and possible queries can be found [here](https://florianholzapfel.github.io/express-restify-mongoose/v1/).

    
## Contributing
Fork the repo, make changes and send a PR. We'll review it together!

Commit messages should follow [Angular's conventions](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular).

## License
This project is licensed under the terms of MIT license. For more information, please see the [LICENSE](LICENSE) file.

## Citation
If you use this repository, or use our tool for analysis, please cite our work:

```bib
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
