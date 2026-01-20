{ stdenv, ... }:
stdenv.mkDerivation {
  name = "web-cum-army";
  src = ./build;
  installPhase = ''
    mkdir -p $out
    cp -R ./* $out/
  '';
}
