{ stdenv, ... }:
stdenv.mkDerivation {
  name = "web-cum-army";
  src = ./public;
  installPhase = ''
    mkdir -p $out
    cp -R ./* $out/
  '';
}
