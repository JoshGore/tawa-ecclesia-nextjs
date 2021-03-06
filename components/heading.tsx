import React, { ReactNode } from "react";
// import { IGatsbyImageData } from 'gatsby-plugin-image';
import Image from "next/image";
import FullBleedHeading from "./fullBleedHeading";
import BasicHeading from "./basicHeading";
import IFrameHeading from "./iFrameHeading";

export interface IHeading {
  title: string | ReactNode;
  subtitle: string | ReactNode;
  imageSrc?: string;
  imageBlurDataURL?: string;
  alt?: string;
  type: "Full Bleed" | "Standard" | "YouTube";
  textColor?: string;
  textPosition?: "top" | "bottom";
  url?: string;
}

const Heading: React.FC<IHeading> = ({
  title,
  subtitle,
  imageSrc,
  imageBlurDataURL,
  alt,
  type,
  textColor,
  textPosition,
  url,
}) => {
  return (
    <>
      {imageSrc && type == "Full Bleed" && (
        <FullBleedHeading
          title={title}
          subtitle={subtitle}
          image={imageSrc}
          imageBlurDataURL={imageBlurDataURL}
          alt={alt}
          textColor={textColor}
          textPosition={textPosition}
        />
      )}
      {type != "YouTube" && (!imageSrc || type == "Standard") && (
        <BasicHeading
          title={title}
          subtitle={subtitle}
          imageSrc={imageSrc}
          imageBlurDataURL={imageBlurDataURL}
          alt={alt}
        />
      )}
      {type == "YouTube" && url && (
        <IFrameHeading title={title} subtitle={subtitle} url={url} />
      )}
    </>
  );
};

export default Heading;
