import React, {useLayoutEffect, useState} from 'react';
import ModalHeader from "./ModalHeader";

function ModalImage(props) {
  const {image_type, label_url, preview_label_url, macro_url, thumbnail_url, preview_macro_url} = props;

  function display_image(image_type) {
    switch (image_type) {
      case 'label':
        return <img className={"__inspect-image"} alt={label_url} src={label_url}/>
      case 'preview_label':
        return <img className={"__inspect-image"} alt={label_url} src={preview_label_url}/>
      case 'macro':
        return <img className={"__inspect-image"} alt={label_url} src={macro_url}/>
      case 'thumbnail':
        return <img className={"__inspect-image"} alt={label_url} src={thumbnail_url}/>
      case 'preview_macro':
        return <img className={"__inspect-image"} alt={label_url} src={preview_macro_url}/>
      default:
        return <img className={"__inspect-image"} alt={label_url} src={label_url}/>
    }
  }

  return (
    <div className="__modal _large">
      <ModalHeader title={"Preview"} type={"image"}/>
      {display_image(image_type)}
    </div>
  )
}

export default ModalImage;