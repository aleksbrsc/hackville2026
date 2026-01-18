{
  description = "Python dev shell with pexpect";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux"; # change if needed (e.g. aarch64-darwin)
      pkgs = import nixpkgs { inherit system; };
      python = pkgs.python3;
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = [
          python
          python.pkgs.requests
        ];
      };
    };
}

