# NLP-Land-backend

<p align="center">
<a href="https://github.com/ag-gipp/NLP-Land-backend/actions/workflows/release.yml"><img alt="Actions Status" src="https://github.com/ag-gipp/NLP-Land-backend/actions/workflows/release.yml/main.svg">  
<a href="https://github.com/ag-gipp/NLP-Land-backend/actions/workflows/main.yml"><img alt="Actions Status" src="https://github.com/ag-gipp/NLP-Land-backend/actions/workflows/main.yml/badge.svg?branch=main">
<!-- Add code coverage report here -->
<a href="https://github.com/ag-gipp/NLP-Land-backend/blob/master/LICENSE"><img alt="License: MIT" src="https://black.readthedocs.io/en/stable/_static/license.svg"></a>
<a href="https://github.com/psf/black"><img alt="Code style: Airbnb" src="https://img.shields.io/badge/codestyle-Airbnb-red"></a>
<a href="https://github.com/semantic-release/semantic-release"><img alt="Semantic Release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg"></a>
<a href="https://github.com/ag-gipp/NLP-Land-backend/releases"><img alt="Actions Status" src="https://img.shields.io/github/v/release/ag-gipp/NLP-Land-backend?sort=semver"></a>

</p>

## Getting Started

### Production

To spin up the production version of this project, switch into the root directory of this project and run:

```console
cd NLP-Land-backend
docker-compose up --build
```

### Development

To run the development environment locally, you need to spin up a mongodb instance.

```console
source .env && docker run -d -p 27017:27017 --name mongodev \
    -e MONGO_INITDB_ROOT_USERNAME=$MONGO_USER \
    -e MONGO_INITDB_ROOT_PASSWORD=$MONGO_PASSWORD \
    -e MONGO_INITDB_DATABASE=$MONGO_DB \
    mongo
```

Then you can refresh the backend with auto-reload (that is whenever the code was changed) using:

```console
set -o allexport
source .env
npm run build:live
```

## Documentation

TODO: Add documentation link to github pages and to standard enpoints [here](https://florianholzapfel.github.io/express-restify-mongoose/v1/).

## Tests

### CI

Whenever you create a pull request against the default branch, GitHub actions will create a CI job executing unit tests and linting.

### Local

To run these CI pipelines such as tests and linting locally install [act](https://github.com/nektos/act). With act you can run CI tests in docker containers the way they are run on GitHub actions.

To run the full check suite with act you need the full ubuntu image (>12GB) and then execute:

```console
act -P self-hosted=nektos/act-environments-ubuntu:18.04-full --reuse --rm
```

To run a single check like the Test from the pipeline, execute:

```console
act -j Test -P self-hosted=nektos/act-environments-ubuntu:18.04-full --reuse --rm
```

You can also run the tests without act using:

```console
npm run test
npm run lint
```

## Releases and deploys (TODO)

New Git and GitHub deploys, releases, as well as changelogs are automatically created and deployed when a pull request is merged from the `dev` into the `main` branch.
Every time you want to develop a new feature, create an issue and assign yourself to that issue. This will trigger a GitHub action that creates a new issue from the dev branch.
When you are done developing, create a commit with a message that includes "#patch", "#minor", or "#major" according to the semantic versioning [specification](https://semver.org/).
Next, create a pull request to the `dev` branch. Assign the pull request one of the labels "fix", "feature", or "test" so they appear correctly later in the changelogs.

TODO: Add instructions on semantic release.

## Contributing

Fork the repo, make changes and send a PR. We'll review it together!

## License

This project is licensed under the terms of MIT license. For more information, please see the [LICENSE](LICENSE) file.

## Citation

If you use this repository, or use our tool for analysis, please cite our work:

TODO: Add citation here and as CITATION.cff file when paper is out.
