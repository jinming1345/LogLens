# LogLens Ubuntu 20.04 Release

This release profile is dedicated to Ubuntu 20.04/Focal.

The main Linux build used Tauri v2, which links against WebKitGTK 4.1. Ubuntu
20.04 ships WebKitGTK 4.0 packages, so this branch uses Tauri v1 for the
Ubuntu 20.04 build.

## Release tag

Push a tag with this format to build and publish the Ubuntu 20.04 assets:

```bash
git tag ubuntu20.04-v1.0.1
git push origin release/ubuntu20.04 --tags
```

The `.github/workflows/release-ubuntu20.04.yml` workflow builds inside an
`ubuntu:20.04` container and uploads:

- `.deb`
- `.AppImage`
- raw `loglens` binary

## Local build on Ubuntu 20.04

```bash
chmod +x release/Ubuntu20.04/build.sh
./release/Ubuntu20.04/build.sh
```

The build outputs are created under:

```text
src-tauri/target/release/bundle/
```
