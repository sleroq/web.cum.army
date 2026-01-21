import React, { ChangeEvent, useState } from 'react';
import { ChartBarIcon } from '@heroicons/react/16/solid';

interface QualityComponentProps {
  layers: string[];
  layerEndpoint: string;
  hasPacketLoss: boolean;
  currentLayer: string;
  onLayerSelect: (layer: string) => void;
}

const QualitySelectorComponent = (props: QualityComponentProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const onLayerChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newLayer = event.target.value;
    fetch(props.layerEndpoint, {
      method: 'POST',
      body: JSON.stringify({ mediaId: '1', encodingId: newLayer }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch((err) => console.error('onLayerChange', err));
    setIsOpen(false);
    props.onLayerSelect(newLayer);
  };

  const layerList = [
    { id: 'disabled', label: 'No Layer Selected', value: 'disabled' },
    ...props.layers.map((layer, index) => ({
      id: `layer-${index}-${layer}`,
      label: layer,
      value: layer,
    })),
  ].map((item) => (
    <option key={item.id} value={item.value}>
      {item.label}
    </option>
  ));

  return (
    <div className="flex items-center relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => (props.layers.length <= 1 ? false : !prev))}
        className={`p-1 rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 ${
          props.hasPacketLoss ? 'text-orange-600' : ''
        }`}
        aria-label="Quality Selector"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <ChartBarIcon className="size-7" />
      </button>

      {isOpen && (
        <select
          onChange={onLayerChange}
          value={props.currentLayer}
          className="
				absolute 
				right-0
				bottom-12
				w-50
				appearance-none
				border
				py-2
				px-3
				leading-tight
				focus:outline-hidden
				focus:shadow-outline
				bg-gray-700
				border-gray-700
				text-white
				rounded-sm
				shadow-md
				placeholder-gray-200"
        >
          {layerList}
        </select>
      )}
    </div>
  );
};

export default QualitySelectorComponent;
