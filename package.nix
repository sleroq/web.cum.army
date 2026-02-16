{
  bun,
  bun2nix,
  lib,
  stdenv,
  siteTitle ? "Broadcast Box",
  apiPath ? "",
  iceServers ? "",
}:

let
  src = lib.cleanSourceWith {
    src = ./.;
    filter =
      path: type:
      let
        name = baseNameOf path;
      in
      !(builtins.elem name [
        "node_modules"
        "build"
      ]);
  };
in
stdenv.mkDerivation {
  pname = "web-cum-army";
  version = "0.1.0";

  inherit src;

  nativeBuildInputs = [
    bun
    bun2nix.hook
  ];

  bunDeps = bun2nix.fetchBunDeps {
    bunNix = ./bun.nix;
  };

  buildPhase = ''
    bun run build
  '';

  VITE_SITE_TITLE = siteTitle;
  VITE_API_PATH = apiPath;
  VITE_ICE_SERVERS = iceServers;

  installPhase = ''
    runHook preInstall

    mkdir -p "$out"
    cp -R build/* "$out"/
    if [ -d assets ]; then
      cp -R assets "$out"/
    fi

    runHook postInstall
  '';
}
