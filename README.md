# er-viewer

`er-viewer` is a small local web app for working with 360° equirectangular JPEG images. It lets you:

- upload a JPEG file
- inspect EXIF/XMP metadata in a dedicated popup view
- highlight panorama-relevant metadata such as projection type, panorama viewer flag, image size, and exposure details
- detect whether the image has GPano projection metadata required for correct 360° rendering
- preview it in a 360° viewer using Pannellum
- add the required `GPano:ProjectionType="equirectangular"` and `UsePanoramaViewer="True"` tags
- view photo metadata such as ISO, exposure time, aperture, flash, and exposure mode
- download a tagged copy of the image

The app runs as an Express server and serves the front-end from the `public` folder.

## Requirements

- Node.js 18+ recommended
- npm
- `exiftool` installed on your system

### Install exiftool

On macOS with Homebrew:

```bash
brew install exiftool
```

On Ubuntu/Debian:

```bash
sudo apt-get install libimage-exiftool-perl
```

## Install

From the project folder:

```bash
cd /Users/tobtr46/Library/CloudStorage/OneDrive-Linköpingsuniversitet/Dokument/Coding\ Tryouts/er-viewer
npm install
```

## Start the app

```bash
npm start
```

This starts the server defined in `server.js`.

Then open:

```text
http://localhost:3000
```

## What the app does

1. Upload a JPEG file.
2. The server saves the file in `public/uploads`.
3. The app reads EXIF/XMP metadata with `exiftool`.
4. It checks whether the image has the panorama metadata needed for correct 360° display, especially:
   - `ProjectionType = equirectangular`
   - `UsePanoramaViewer = True`
5. A metadata popup highlights the most relevant panorama and photo details, including ISO, exposure time, aperture, and other camera settings.
6. If the file is missing the GPano metadata, you can either:
   - view it temporarily without modifying the file, or
   - permanently write the metadata to a copied version and download it.
7. The file is shown in a 360° viewer for panoramic viewing.

## Useful commands

Start the app:

```bash
npm start
```

Stop it:

```bash
Ctrl + C
```

## Project files

- `server.js` — Express API and metadata handling
- `public/index.html` — front-end UI and 360° viewer logic
- `public/uploads` — uploaded files are stored here

## Notes

- Only JPEG files are supported.
- The app listens on port `3000`.
- If port `3000` is already in use, the server exits with an error message telling you to free the port first.
- The metadata popup highlights missing panorama fields and shows missing values as `Missing`, which helps quickly assess whether an image is suitable for 360° display.
- Photo metadata such as ISO, shutter speed, aperture, flash, and exposure mode are included when available.
