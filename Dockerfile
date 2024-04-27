# ARG DENO_VERSION=1.42.4
# FROM denoland/deno:bin-$DENO_VERSION AS deno
# FROM ubuntu
# COPY --from=deno /deno /usr/local/bin/deno
# !!! ======== WIP: THIS FILE IS NOT INTEND TO BE USED ======== !!!

FROM --platform=linux/arm64 denoland/deno:distroless

# The port that your application listens to.
EXPOSE 8080

WORKDIR /app

# Prefer not to run as root.
USER deno

# Cache the dependencies as a layer (the following two steps are re-run only when deps.ts is modified).
# Ideally cache deps.ts will download and compile _all_ external files used in main.ts.
COPY deps.ts .
RUN deno cache deps.ts

# These steps will be re-run upon each file change in your working directory:
COPY . .
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache main.ts

CMD ["run", "--allow-net", "main.ts"]

# docker run --platform=linux/arm64 -it --rm denoland/deno:distroless run ...
# deno compile --target aarch64-unknown-linux-gnu ...
