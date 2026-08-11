import type { Material, Object3D, Texture } from "three";

interface DisposableGeometry {
  dispose: () => void;
}

interface RenderableObject extends Object3D {
  geometry?: DisposableGeometry;
  material?: Material | Material[];
}

export function disposeObjectTree(root: Object3D): void {
  const geometries = new Set<DisposableGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();

  root.traverse((object) => {
    const renderable = object as RenderableObject;
    if (renderable.geometry !== undefined) {
      geometries.add(renderable.geometry);
    }
    const objectMaterials = Array.isArray(renderable.material)
      ? renderable.material
      : renderable.material === undefined
        ? []
        : [renderable.material];
    objectMaterials.forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value: unknown) => {
        if (isTexture(value)) {
          textures.add(value);
        }
      });
    });
  });

  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  root.clear();
}

function isTexture(value: unknown): value is Texture {
  return (
    typeof value === "object" &&
    value !== null &&
    "isTexture" in value &&
    value.isTexture === true &&
    "dispose" in value &&
    typeof value.dispose === "function"
  );
}
