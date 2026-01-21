{ lib
, buildNpmPackage
, siteTitle ? "Broadcast Box"
, apiPath ? ""
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

  VITE_SITE_TITLE = siteTitle;
  VITE_API_PATH = apiPath;

  npmDepsHash = "sha256-BxhPPftuPLwWbe5XY5OHFobYAn+v29Nn/WcnLuh7Tfo=";

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
