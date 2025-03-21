import _ from 'lodash';
import {
    AnnotateCopyNumberAlterationQuery,
    AnnotateMutationByProteinChangeQuery,
    AnnotateStructuralVariantQuery,
    IndicatorQueryResp,
    LevelOfEvidence,
} from 'oncokb-ts-api-client';
import { EvidenceType, OncoKbCardDataType } from '../model/OncoKB';

export const LEVELS = {
    sensitivity: ['4', '3B', '3A', '2', '1', '0'],
    resistance: ['R3', 'R2', 'R1'],
    all: ['4', 'R3', '3B', '3A', 'R2', '2', '1', 'R1', '0'],
};

export enum AlterationTypes {
    Mutation = 0,
}

export function generatePartialEvidenceQuery(evidenceTypes?: string) {
    return {
        evidenceTypes: evidenceTypes
            ? evidenceTypes
            : 'GENE_SUMMARY,GENE_BACKGROUND,ONCOGENIC,MUTATION_EFFECT,VUS,MUTATION_SUMMARY,TUMOR_TYPE_SUMMARY,STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY,STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE,INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY,INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE',
        highestLevelOnly: false,
        levels: [
            LevelOfEvidence.LEVEL_1,
            LevelOfEvidence.LEVEL_2,
            LevelOfEvidence.LEVEL_3A,
            LevelOfEvidence.LEVEL_3B,
            LevelOfEvidence.LEVEL_4,
            LevelOfEvidence.LEVEL_R1,
            LevelOfEvidence.LEVEL_R2,
        ],
        source: 'cbioportal',
    };
}

export function generateQueryVariant(
    entrezGeneId: number,
    tumorType: string | null,
    alteration?: string,
    mutationType?: string,
    proteinPosStart?: number,
    proteinPosEnd?: number,
    alterationType?: string
) {
    let query = {
        id: generateQueryVariantId(
            entrezGeneId,
            tumorType,
            alteration,
            mutationType
        ),
        hugoSymbol: '',
        tumorType: tumorType as string, // generated api typings are wrong, it can accept null
        alterationType:
            alterationType || AlterationTypes[AlterationTypes.Mutation],
        entrezGeneId: entrezGeneId,
        alteration: alteration || '',
        consequence: mutationType || 'any',
        proteinStart: proteinPosStart === undefined ? -1 : proteinPosStart,
        proteinEnd: proteinPosEnd === undefined ? -1 : proteinPosEnd,
        type: 'web',
        hgvs: '',
        svType: 'DELETION', // TODO: hack because svType is not optional
    };

    // Use proper parameters for Intragenic variant
    if (query.alteration.toLowerCase().indexOf('intragenic') !== -1) {
        query.alterationType = 'structural_variant';
        query.svType = 'DELETION';
        query.consequence = '';
    }
    return query;
}

export function generateQueryStructuralVariantId(
    site1EntrezGeneId: number,
    site2EntrezGeneId: number | undefined,
    tumorType: string | null,
    structuralVariantType: keyof typeof StructuralVariantType
): string {
    let id = `${site1EntrezGeneId}_${site2EntrezGeneId}_${structuralVariantType}`;
    if (tumorType) {
        id = `${id}_${tumorType}`;
    }

    return id.trim().replace(/\s/g, '_');
}

export function generateQueryVariantId(
    entrezGeneId: number,
    tumorType: string | null,
    alteration?: string,
    mutationType?: string
): string {
    let id = tumorType ? `${entrezGeneId}_${tumorType}` : `${entrezGeneId}`;

    if (alteration) {
        id = `${id}_${alteration}`;
    }

    if (mutationType) {
        id = `${id}_${mutationType}`;
    }

    return id.trim().replace(/\s/g, '_');
}

export function defaultOncoKbIndicatorFilter(indicator: IndicatorQueryResp) {
    return indicator.oncogenic
        .toLowerCase()
        .trim()
        .includes('oncogenic');
}

export function generateIdToIndicatorMap(
    data: IndicatorQueryResp[]
): { [queryId: string]: IndicatorQueryResp } {
    const map: { [queryId: string]: IndicatorQueryResp } = {};

    _.each(data, function(indicator) {
        map[indicator.query.id] = indicator;
    });

    return map;
}

export function generateProteinChangeQuery(
    entrezGeneId: number,
    tumorType: string | null,
    alteration?: string,
    mutationType?: string,
    proteinPosStart?: number,
    proteinPosEnd?: number,
    evidenceTypes?: EvidenceType[]
): AnnotateMutationByProteinChangeQuery {
    return {
        id: generateQueryVariantId(
            entrezGeneId,
            tumorType,
            alteration,
            mutationType
        ),
        alteration,
        consequence: mutationType,
        gene: {
            entrezGeneId,
        },
        proteinEnd: proteinPosEnd,
        proteinStart: proteinPosStart,
        tumorType,
        evidenceTypes: evidenceTypes,
    } as AnnotateMutationByProteinChangeQuery;
}

export function generateCopyNumberAlterationQuery(
    entrezGeneId: number,
    tumorType: string | null,
    alteration: string,
    evidenceTypes?: EvidenceType[]
): AnnotateCopyNumberAlterationQuery {
    return {
        id: generateQueryVariantId(entrezGeneId, tumorType, alteration),
        copyNameAlterationType: alteration!.toUpperCase(),
        gene: {
            entrezGeneId: entrezGeneId,
        },
        tumorType: tumorType,
        evidenceTypes: evidenceTypes,
    } as AnnotateCopyNumberAlterationQuery;
}

const FUSION_REGEX = '(\\w+)-(\\w+)(\\s+fusion)?';
const INTRAGENIC_REGEX = '(\\w+)-intragenic';

export function generateAnnotateStructuralVariantQuery(
    entrezGeneId: number,
    tumorType: string | null,
    proteinChange: string,
    mutationType?: string,
    evidenceTypes?: EvidenceType[]
): AnnotateStructuralVariantQuery {
    const id = generateQueryVariantId(
        entrezGeneId,
        tumorType,
        proteinChange,
        mutationType
    );
    const intragenicResult = new RegExp(INTRAGENIC_REGEX, 'gi').exec(
        proteinChange
    );
    if (intragenicResult) {
        return {
            id: id,
            geneA: {
                hugoSymbol: intragenicResult![1],
            },
            geneB: {
                hugoSymbol: intragenicResult![1],
            },
            structuralVariantType: 'DELETION',
            functionalFusion: false,
            tumorType: tumorType,
            evidenceTypes: evidenceTypes,
        } as AnnotateStructuralVariantQuery;
    }
    const fusionResult = new RegExp(FUSION_REGEX, 'gi').exec(proteinChange);
    if (fusionResult) {
        return {
            id: id,
            geneA: {
                hugoSymbol: fusionResult![1],
            },
            geneB: {
                hugoSymbol: fusionResult![2],
            },
            structuralVariantType: 'FUSION',
            functionalFusion: true,
            tumorType: tumorType,
            evidenceTypes: evidenceTypes,
        } as AnnotateStructuralVariantQuery;
    }
    // we need to take a look what other fusion the table possibly includes
    return {
        id: id,
        geneA: {
            hugoSymbol: proteinChange,
        },
        geneB: {
            hugoSymbol: proteinChange,
        },
        structuralVariantType: 'FUSION',
        functionalFusion: false,
        tumorType: tumorType,
        evidenceTypes: evidenceTypes,
    } as AnnotateStructuralVariantQuery;
}

export enum StructuralVariantType {
    DELETION = 'DELETION',
    TRANSLOCATION = 'TRANSLOCATION',
    DUPLICATION = 'DUPLICATION',
    INSERTION = 'INSERTION',
    INVERSION = 'INVERSION',
    FUSION = 'FUSION',
    UNKNOWN = 'UNKNOWN',
}

export function generateAnnotateStructuralVariantQueryFromGenes(
    site1EntrezGeneId: number,
    site2EntrezGeneId: number | undefined,
    tumorType: string | null,
    structuralVariantType: keyof typeof StructuralVariantType,
    evidenceTypes?: EvidenceType[]
): AnnotateStructuralVariantQuery {
    // For most of the SV in the portal, we can assume they are fusion event. The assumption is based on that user generally will not import none fusion event in database.
    // Intragenic deletion event is similar to fusion event but happens within the same gene. In this case, it's not a functional fusion but rather a deletion.
    // Intragenic event usually is stored in the database with only one gene available, so the site2 usually is undefined or the same as site1.
    let isIntragenic =
        (site1EntrezGeneId === site2EntrezGeneId ||
            site2EntrezGeneId === undefined) &&
        structuralVariantType === StructuralVariantType.DELETION;

    return {
        id: generateQueryStructuralVariantId(
            site1EntrezGeneId,
            site2EntrezGeneId,
            tumorType,
            structuralVariantType
        ),
        geneA: {
            entrezGeneId: site1EntrezGeneId,
        },
        geneB: {
            entrezGeneId: isIntragenic ? site1EntrezGeneId : site2EntrezGeneId,
        },
        structuralVariantType: structuralVariantType,
        functionalFusion: !isIntragenic,
        tumorType,
        evidenceTypes: evidenceTypes,
    } as AnnotateStructuralVariantQuery;
}

export function calculateOncoKbAvailableDataType(
    annotations: IndicatorQueryResp[]
) {
    // Always show oncogenicity icon as long as the annotation exists
    const availableDataTypes = new Set<OncoKbCardDataType>();
    if (annotations.length > 0) {
        availableDataTypes.add(OncoKbCardDataType.BIOLOGICAL);
    }
    annotations.forEach(annotation => {
        if (!!annotation.highestSensitiveLevel) {
            availableDataTypes.add(OncoKbCardDataType.TXS);
        }
        if (!!annotation.highestResistanceLevel) {
            availableDataTypes.add(OncoKbCardDataType.TXR);
        }
        if (!!annotation.highestPrognosticImplicationLevel) {
            availableDataTypes.add(OncoKbCardDataType.PX);
        }
        if (!!annotation.highestDiagnosticImplicationLevel) {
            availableDataTypes.add(OncoKbCardDataType.DX);
        }
    });
    return Array.from(availableDataTypes);
}
