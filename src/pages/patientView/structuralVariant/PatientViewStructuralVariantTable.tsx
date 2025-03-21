import * as React from 'react';
import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import TumorColumnFormatter from '../mutation/column/TumorColumnFormatter';
import HeaderIconMenu from '../mutation/HeaderIconMenu';
import GeneFilterMenu from '../mutation/GeneFilterMenu';
import PanelColumnFormatter from 'shared/components/mutationTable/column/PanelColumnFormatter';
import _ from 'lodash';
import { MakeMobxView } from 'shared/components/MobxView';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from 'shared/components/ErrorMessage';
import AnnotationColumnFormatter from './column/AnnotationColumnFormatter';
import { getServerConfig } from 'config/config';
import { ServerConfigHelpers } from 'config/config';
import ChromosomeColumnFormatter from 'shared/components/mutationTable/column/ChromosomeColumnFormatter';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    calculateOncoKbContentPadding,
    calculateOncoKbContentWidthOnNextFrame,
    calculateOncoKbContentWidthWithInterval,
    DEFAULT_ONCOKB_CONTENT_WIDTH,
    updateOncoKbIconStyle,
} from 'shared/lib/AnnotationColumnUtils';
import { StructuralVariant } from 'cbioportal-ts-api-client';

export interface IPatientViewStructuralVariantTableProps {
    store: PatientViewPageStore;
    onSelectGenePanel?: (name: string) => void;
    mergeOncoKbIcons?: boolean;
}

type CNATableColumn = Column<StructuralVariant[]> & { order: number };

class StructuralVariantTableComponent extends LazyMobXTable<
    StructuralVariant[]
> {}

const ANNOTATION_ELEMENT_ID = 'sv-annotation';

@observer
export default class PatientViewStructuralVariantTable extends React.Component<
    IPatientViewStructuralVariantTableProps,
    {}
> {
    @observable mergeOncoKbIcons;
    @observable oncokbWidth = DEFAULT_ONCOKB_CONTENT_WIDTH;
    private oncokbInterval: any;

    constructor(props: IPatientViewStructuralVariantTableProps) {
        super(props);
        makeObservable(this);

        // here we wait for the oncokb icons to fully finish rendering
        // then update the oncokb width in order to align annotation column header icons with the cell content
        this.oncokbInterval = calculateOncoKbContentWidthWithInterval(
            ANNOTATION_ELEMENT_ID,
            oncoKbContentWidth => (this.oncokbWidth = oncoKbContentWidth)
        );

        this.mergeOncoKbIcons = !!props.mergeOncoKbIcons;
    }

    public destroy() {
        clearInterval(this.oncokbInterval);
    }

    readonly columns = remoteData({
        await: () => [
            this.props.store.sampleManager,
            this.props.store.sampleToStructuralVariantGenePanelId,
            this.props.store.genePanelIdToEntrezGeneIds,
            this.props.store.structuralVariantTableShowGeneFilterMenu,
            this.props.store.oncoKbAnnotatedGenes,
            this.props.store.studyIdToStudy,
            this.props.store.oncoKbCancerGenes,
        ],
        invoke: async () => {
            const columns: CNATableColumn[] = [];
            const numSamples = this.props.store.sampleIds.length;

            if (numSamples >= 2) {
                columns.push({
                    name: 'Samples',
                    render: (d: StructuralVariant[]) => {
                        return TumorColumnFormatter.renderFunction(
                            d.map(datum => {
                                // if both are available, return both genes in an array
                                // otherwise, return whichever is available
                                const genes =
                                    datum.site1EntrezGeneId &&
                                    datum.site2EntrezGeneId
                                        ? [
                                              datum.site1EntrezGeneId,
                                              datum.site2EntrezGeneId,
                                          ]
                                        : datum.site1EntrezGeneId ||
                                          datum.site2EntrezGeneId;
                                return {
                                    sampleId: datum.sampleId,
                                    entrezGeneId: genes,
                                    sv: true,
                                };
                            }),
                            this.props.store.sampleManager.result!,
                            this.props.store
                                .sampleToStructuralVariantGenePanelId.result!,
                            this.props.store.genePanelIdToEntrezGeneIds.result!,
                            this.props.onSelectGenePanel
                        );
                    },
                    sortBy: (d: StructuralVariant[]) =>
                        TumorColumnFormatter.getSortValue(
                            d,
                            this.props.store.sampleManager.result!
                        ),
                    download: (d: StructuralVariant[]) =>
                        TumorColumnFormatter.getSample(d),
                    order: 20,
                    resizable: true,
                });
            }

            columns.push({
                name: 'Gene 1',
                render: (d: StructuralVariant[]) => (
                    <span data-test="sv-table-gene1-column">
                        {d[0].site1HugoSymbol}
                    </span>
                ),
                filter: (
                    d: StructuralVariant[],
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return d[0].site1HugoSymbol.indexOf(filterStringUpper) > -1;
                },
                download: (d: StructuralVariant[]) => d[0].site1HugoSymbol,
                sortBy: (d: StructuralVariant[]) => d[0].site1HugoSymbol,
                headerRender: (name: string) => {
                    return (
                        <HeaderIconMenu
                            name={name}
                            showIcon={
                                this.props.store
                                    .structuralVariantTableShowGeneFilterMenu
                                    .result
                            }
                        >
                            <GeneFilterMenu
                                onOptionChanged={
                                    this.props.store
                                        .onFilterGenesStructuralVariantTable
                                }
                                currentSelection={
                                    this.props.store
                                        .structuralVariantTableGeneFilterOption
                                }
                            />
                        </HeaderIconMenu>
                    );
                },
                visible: true,
                order: 30,
            });

            columns.push({
                name: 'Gene 2',
                render: (d: StructuralVariant[]) => (
                    <span data-test="sv-table-gene2-column">
                        {d[0].site2HugoSymbol}
                    </span>
                ),
                filter: (
                    d: StructuralVariant[],
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return (
                        (d[0].site2HugoSymbol || '').indexOf(
                            filterStringUpper
                        ) > -1
                    );
                },
                download: (d: StructuralVariant[]) => d[0].site2HugoSymbol,
                sortBy: (d: StructuralVariant[]) => d[0].site2HugoSymbol,
                headerRender: (name: string) => {
                    return (
                        <HeaderIconMenu
                            name={name}
                            showIcon={
                                this.props.store
                                    .structuralVariantTableShowGeneFilterMenu
                                    .result
                            }
                        >
                            <GeneFilterMenu
                                onOptionChanged={
                                    this.props.store
                                        .onFilterGenesStructuralVariantTable
                                }
                                currentSelection={
                                    this.props.store
                                        .structuralVariantTableGeneFilterOption
                                }
                            />
                        </HeaderIconMenu>
                    );
                },
                visible: true,
                order: 35,
            });

            const genePanelProps = (d: StructuralVariant[]) => ({
                data: d.map(datum => ({
                    sampleId: datum.sampleId,
                    entrezGeneId: datum.site1EntrezGeneId,
                })),
                sampleToGenePanelId: this.props.store
                    .sampleToStructuralVariantGenePanelId.result!,
                sampleManager: this.props.store.sampleManager.result!,
                genePanelIdToGene: this.props.store.genePanelIdToEntrezGeneIds
                    .result!,
                onSelectGenePanel: this.props.onSelectGenePanel,
            });

            columns.push({
                name: 'Gene panel',
                render: (d: StructuralVariant[]) =>
                    PanelColumnFormatter.renderFunction(genePanelProps(d)),
                download: (d: StructuralVariant[]) =>
                    PanelColumnFormatter.download(genePanelProps(d)),
                sortBy: (d: StructuralVariant[]) =>
                    PanelColumnFormatter.getGenePanelIds(genePanelProps(d)),
                visible: false,
                order: 40,
            });

            columns.push({
                name: 'Annotation',
                headerRender: (name: string) =>
                    AnnotationColumnFormatter.headerRender(
                        name,
                        this.oncokbWidth,
                        this.mergeOncoKbIcons,
                        this.handleOncoKbIconModeToggle
                    ),
                render: (d: StructuralVariant[]) => (
                    <span id="sv-annotation">
                        {AnnotationColumnFormatter.renderFunction(d, {
                            uniqueSampleKeyToTumorType: this.props.store
                                .uniqueSampleKeyToTumorType,
                            oncoKbData: this.props.store
                                .structuralVariantOncoKbData,
                            oncoKbCancerGenes: this.props.store
                                .oncoKbCancerGenes,
                            usingPublicOncoKbInstance: this.props.store
                                .usingPublicOncoKbInstance,
                            mergeOncoKbIcons: this.mergeOncoKbIcons,
                            oncoKbContentPadding: calculateOncoKbContentPadding(
                                this.oncokbWidth
                            ),
                            enableOncoKb: getServerConfig()
                                .show_oncokb as boolean,
                            pubMedCache: this.props.store.pubMedCache,
                            enableCivic: false,
                            enableMyCancerGenome: false,
                            enableHotspot: false,
                            userEmailAddress: ServerConfigHelpers.getUserEmailAddress(),
                            studyIdToStudy: this.props.store.studyIdToStudy
                                .result,
                        })}
                    </span>
                ),
                sortBy: (d: StructuralVariant[]) => {
                    return AnnotationColumnFormatter.sortValue(
                        d,
                        this.props.store.oncoKbCancerGenes,
                        this.props.store.usingPublicOncoKbInstance,
                        this.props.store.structuralVariantOncoKbData,
                        this.props.store.uniqueSampleKeyToTumorType
                    );
                },
                order: 45,
            });

            columns.push({
                name: 'Variant Class',
                render: (d: StructuralVariant[]) => (
                    <span>{d[0].variantClass}</span>
                ),
                filter: (
                    d: StructuralVariant[],
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return (
                        d[0].variantClass
                            .toUpperCase()
                            .indexOf(filterStringUpper) > -1
                    );
                },
                download: (d: StructuralVariant[]) => d[0].variantClass,
                sortBy: (d: StructuralVariant[]) => d[0].variantClass,
                visible: true,
                order: 50,
            });

            columns.push({
                name: 'Site1 Chromosome',
                render: (d: StructuralVariant[]) => (
                    <span>
                        {ChromosomeColumnFormatter.getData(
                            d.map(datum => ({ chr: datum.site1Chromosome }))
                        )}
                    </span>
                ),
                download: (d: StructuralVariant[]) =>
                    ChromosomeColumnFormatter.getData(
                        d.map(datum => ({ chr: datum.site1Chromosome }))
                    ) || '',
                sortBy: (d: StructuralVariant[]) =>
                    ChromosomeColumnFormatter.getSortValue(
                        d.map(datum => ({ chr: datum.site1Chromosome }))
                    ),
                filter: (
                    d: StructuralVariant[],
                    filterString: string,
                    filterStringUpper: string
                ) =>
                    (
                        ChromosomeColumnFormatter.getData(
                            d.map(datum => ({ chr: datum.site1Chromosome }))
                        ) + ''
                    )
                        .toUpperCase()
                        .includes(filterStringUpper),
                visible: false,
                order: 51,
            });

            columns.push({
                name: 'Site2 Chromosome',
                render: (d: StructuralVariant[]) => (
                    <span>
                        {ChromosomeColumnFormatter.getData(
                            d.map(datum => ({ chr: datum.site2Chromosome }))
                        )}
                    </span>
                ),
                download: (d: StructuralVariant[]) =>
                    ChromosomeColumnFormatter.getData(
                        d.map(datum => ({ chr: datum.site2Chromosome }))
                    ) || '',
                sortBy: (d: StructuralVariant[]) =>
                    ChromosomeColumnFormatter.getSortValue(
                        d.map(datum => ({ chr: datum.site2Chromosome }))
                    ),
                filter: (
                    d: StructuralVariant[],
                    filterString: string,
                    filterStringUpper: string
                ) =>
                    (
                        ChromosomeColumnFormatter.getData(
                            d.map(datum => ({ chr: datum.site2Chromosome }))
                        ) + ''
                    )
                        .toUpperCase()
                        .includes(filterStringUpper),
                visible: false,
                order: 52,
            });

            columns.push({
                name: 'Site1 Position',
                render: (d: StructuralVariant[]) => (
                    <span>{d[0].site1Position}</span>
                ),
                download: (d: StructuralVariant[]) => `${d[0].site1Position}`,
                sortBy: (d: StructuralVariant[]) => `${d[0].site1Position}`,
                visible: false,
                order: 55,
            });

            columns.push({
                name: 'Site2 Position',
                render: (d: StructuralVariant[]) => (
                    <span>{d[0].site2Position}</span>
                ),
                download: (d: StructuralVariant[]) => `${d[0].site2Position}`,
                sortBy: (d: StructuralVariant[]) => `${d[0].site2Position}`,
                visible: false,
                order: 65,
            });

            columns.push({
                name: 'Event Info',
                render: (d: StructuralVariant[]) => (
                    <span>{d[0].eventInfo}</span>
                ),
                download: (d: StructuralVariant[]) => d[0].eventInfo,
                sortBy: (d: StructuralVariant[]) => d[0].eventInfo,
                visible: true,
                order: 66,
            });

            columns.push({
                name: 'Connection Type',
                render: (d: StructuralVariant[]) => (
                    <span>{d[0].connectionType}</span>
                ),
                download: (d: StructuralVariant[]) => d[0].connectionType,
                sortBy: (d: StructuralVariant[]) => d[0].connectionType,
                visible: true,
                order: 70,
            });

            columns.push({
                name: 'Breakpoint Type',
                render: (d: StructuralVariant[]) => (
                    <span>{d[0].breakpointType}</span>
                ),
                download: (d: StructuralVariant[]) => d[0].breakpointType,
                sortBy: (d: StructuralVariant[]) => d[0].breakpointType,
                visible: false,
                order: 75,
            });

            columns.push({
                name: 'Additional Annotation',
                render: (d: StructuralVariant[]) => (
                    <span>{d[0].annotation}</span>
                ),
                download: (d: StructuralVariant[]) => d[0].annotation,
                sortBy: (d: StructuralVariant[]) => d[0].annotation,
                visible: false,
                order: 80,
            });

            return _.sortBy(columns, (c: CNATableColumn) => c.order);
        },
        default: [],
    });

    readonly tableUI = MakeMobxView({
        await: () => [
            this.props.store.structuralVariantProfile,
            this.props.store.groupedStructuralVariantData,
            this.columns,
        ],
        render: () => {
            if (
                this.props.store.structuralVariantProfile.result === undefined
            ) {
                return (
                    <div className="alert alert-info" role="alert">
                        Structural Variants are not available.
                    </div>
                );
            }
            return (
                <StructuralVariantTableComponent
                    columns={this.columns.result}
                    data={this.props.store.groupedStructuralVariantData.result!}
                    initialSortColumn="Annotation"
                    initialSortDirection="desc"
                    initialItemsPerPage={10}
                    itemsLabel="Structural Variants"
                    itemsLabelPlural="Structural Variants"
                    showCountHeader={true}
                />
            );
        },
        renderPending: () => <LoadingIndicator isLoading={true} />,
        renderError: () => <ErrorMessage />,
    });

    public render() {
        return this.tableUI.component;
    }

    @action.bound
    private handleOncoKbIconModeToggle(mergeIcons: boolean) {
        this.mergeOncoKbIcons = mergeIcons;
        updateOncoKbIconStyle({ mergeIcons });

        // we need to set the OncoKB width on the next render cycle, otherwise it is not updated yet
        calculateOncoKbContentWidthOnNextFrame(
            ANNOTATION_ELEMENT_ID,
            width => (this.oncokbWidth = width || DEFAULT_ONCOKB_CONTENT_WIDTH)
        );
    }
}
