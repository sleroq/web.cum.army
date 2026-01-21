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

  npmDepsHash = "sha256-wZ5OSOyZNXl79O/saPpFaaHfhyY2u4yO1gf4KfDsiYE=";

  installPhase = ''
    runHook preInstall

    mkdir -p "$out"
    cp -R build/* "$out"/
    cp -R assets "$out"/

    runHook postInstall
  '';
}
