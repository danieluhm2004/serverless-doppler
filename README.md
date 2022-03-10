# Serverless Doppler

It makes it easier to use Doppler without setup in serverless.

## How to use?

First, install the package by entering the following command.

```sh
npm install -D serverless-doppler
```

You can add the following options:

| Config  | Description          | Default                  |
| ------- | -------------------- | ------------------------ |
| project | Doppler project name |
| token   | Doppler token        |
| config  | Doppler config       | Same as serverless stage |

```yaml
custom:
  doppler:
    project: <DOPPLER PROJECT>
    config: <DOPPLER CONFIG>
    token: <DOPPLER TOKEN>
```

Congratulations. Automatically specifies the environment variable at run time.

Successful console log:

```
Loaded Doppler settings. (project: <PROJECT NAME>, config: <CONFIG>)
Loading environment variables from Doppler...
The environment variables below are applied.
  - DOPPLER_PROJECT
  - DOPPLER_ENVIRONMENT
  - DOPPLER_CONFIG
```
