"use client";

import Masonry from "react-masonry-css";

const images = [
  "/testimages/2026-vio-zit_00675_.png",
  "/testimages/2026-vio-zit_00767_.png",
  "/testimages/2026-vio-zit_00833_.png",
  "/testimages/2026-vio-zit_01085_.png",
  "/testimages/2026-vio-zit_00898_.png",
  "/testimages/2026-vio-zit_00901_.png",
  "/testimages/2026-vio-zit_01085_.png",
  "/testimages/2026-vio-zit_01183_.png",
  "/testimages/2026-vio-zit_01722_.png",
  "/testimages/2026-vio-zit_02035_.png",
  "/testimages/2026-vio-zit_02055_.png",
  "/testimages/2026-vio-zit_02173_.png",
  "/testimages/2026-vio-zit_02183_.png",
  "/testimages/2026-vio-zit_02186_.png",
  "/testimages/2026-vio-zit_02238_.png",
  "/testimages/2026-vio-zit_02243_.png",
  "/testimages/2026-vio-zit_02250_.png",
  "/testimages/2026-vio-zit_02274_.png",
  "/testimages/2026-vio-zit_02544_.png",
  "/testimages/2026-vio-zit_02589_.png",
  "/testimages/2026-vio-zit_02637_.png",
  "/testimages/2026-vio-zit_02748_.png",
  "/testimages/2026-vio-zit_02782_.png",
  "/testimages/2026-vio-zit_02786_.png",
  "/testimages/2026-vio-zit_02886_.png",
];

const breakpointColumnsObj = {
  default: 4,
  860: 3,
  500: 2,
};

export default function PostGrid() {
  return (
    <div className=" max-w-7xl mx-auto">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex -ml-4"
        columnClassName="pl-4"
      >
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Post ${index}`}
            className="w-full mb-4 rounded-lg"
          />
        ))}
      </Masonry>
    </div>
  );
}
