{ lib
, buildNpmPackage
}:

buildNpmPackage {
  pname = "web-cum-army";
  version = "0.1.0";

  src = lib.cleanSourceWith {
    src = ./.;
    filter = path: type:
      let
        name = builtins.baseNameOf path;
      in
      !(builtins.elem name [ "node_modules" "build" ]);
  };

  npmBuildScript = "build";

  preBuild = ''
    # Load environment variables from .env file
    if [ -f .env ]; then
      set -a
      source .env
      set +a
    fi
  '';

  npmDepsHash = "sha256-BxhPPftuPLwWbe5XY5OHFobYAn+v29Nn/WcnLuh7Tfo=";

  installPhase = ''
    runHook preInstall

    mkdir -p "$out"
    cp -R build/* "$out"/
    cp -R assets "$out"/

    runHook postInstall
  '';
}
