{ lib
, buildNpmPackage
}:

buildNpmPackage {
  pname = "web-cum-army";
  version = "0.1.0";

  # Build from source (Vite outputs to ./build via vite.config.mjs)
  src = lib.cleanSourceWith {
    src = ./.;
    filter = path: type:
      let
        name = builtins.baseNameOf path;
      in
      # Avoid bundling local artifacts into the Nix source.
      !(builtins.elem name [ "node_modules" "build" ]);
  };

  npmBuildScript = "build";

  npmDepsHash = "sha256-suogIidJASSIKDB+Ym7O7v1v+80lq8SoG11HSzFUM8k=";

  installPhase = ''
    runHook preInstall

    mkdir -p "$out"
    cp -R build/* "$out"/

    runHook postInstall
  '';
}
