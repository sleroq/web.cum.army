{
  description = "web.cum.army static stream player";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        projectPackage = pkgs.callPackage ./package.nix {};
      in
      {
        packages.default = projectPackage;
        defaultPackage = self.packages.${system}.default;
      }
    );
}
