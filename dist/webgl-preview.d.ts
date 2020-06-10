import { Parser } from './gcode-parser';
import * as THREE from 'three';
declare type RenderLayer = {
    extrusion: number[];
    travel: number[];
    z: number;
};
declare type Point = {
    x: number;
    y: number;
    z: number;
};
declare type WebGLPreviewOptions = {
    canvas?: HTMLCanvasElement;
    targetId: string;
    limit?: number;
    topLayerColor?: number;
    lastSegmentColor?: number;
    lineWidth: number;
    renderExtrusion: boolean;
    renderTravel: boolean;
};
export declare class WebGLPreview {
    parser: Parser;
    limit?: number;
    targetId: string;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    group: THREE.Group;
    backgroundColor: number;
    travelColor: number;
    extrusionColor: number;
    topLayerColor?: number;
    lastSegmentColor?: number;
    container: HTMLElement;
    canvas: HTMLCanvasElement;
    renderExtrusion: boolean;
    renderTravel: boolean;
    lineWidth: number | null;
    constructor(opts: WebGLPreviewOptions);
    get layers(): import("./gcode-parser").Layer[];
    animate(): void;
    processGCode(gcode: string | string[]): void;
    render(): void;
    clear(): void;
    resize(): void;
    addLineSegment(layer: RenderLayer, p1: Point, p2: Point, extrude: boolean): void;
    addLine(vertices: number[], color: number): void;
    addThickLine(vertices: number[], color: number): void;
}
export {};
