## What is this Script?

goorbo is a wrapper script that runs a Grey You half-loop, running daily farming with garbo, performing other helpful daily tasks for you, and also acquiring and perming skills for you automatically. It provides basic profit-tracking, and includes calls to `garbo`, `loopgyou`, `CONSUME`, `gain`, and `UberPvPOptimizer`.

## Installation

For the latest features, and to support the script with much-needed feedback on said features, use the testing branch:

```text
git checkout https://github.com/frazazel/goorbo.git testing
```

For a more stable release, use the release branch:

```text
git checkout https://github.com/frazazel/goorbo.git release
```

You will need to `git delete goorbo` before switching branches.

## How to Use

Run `goorbo`, with optional additional arguments (e.g.`goorbo permtier=2 astralpet="astral belt"`). To see a list of all available run-time settings, run `goorbo help`. To see a list of required / recommended items, skills, and familiars, run `goorbo sim`. To see details about what skills goorbo will target perming for you, run `goorbo simperms`.

## Who is Goorbo For?

It is aimed first and foremost at new players with few shinies, and it aims to complete after-prism leveling to level 13 without requiring any specific expensive or unobtainable item besides the Grey Goose, within 30 adventures, spending approximately 150k on potions, mojo filters and and spleen items with +exp% and +mainstat effects. It does support some IotMs and other expensive and/or hard-to-acquire items, and is expected to support more over time, but support for low-shiny players is the primary goal of goorbo. Shinier players may wish to fork goorbo and modify it for their own use.

## Cautions/Disclaimer

I maintain this script, but as an item farmer, I don't run it myself. I rely on testing and feedback from users to improve goorbo.

## Support

If you have any questions, comments or issues, you can contact frazazel on the ASS discord, in channel #grey-you
